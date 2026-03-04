const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const db = require("../db");

function hmacSHA256(secret, raw) {
  return crypto.createHmac("sha256", secret).update(raw).digest("hex");
}

router.post("/return-confirm", async (req, res) => {
  try {
    const secretkey = process.env.MOMO_SECRET_KEY;
    const accessKey = process.env.MOMO_ACCESS_KEY;

    const body = req.body;

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = body;

    // verify signature giống IPN
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode}` +
      `&transId=${transId}`;

    const checkSig = hmacSHA256(secretkey, rawSignature);
    if (checkSig !== signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }


    let userId = null;
    try {
      const decoded = JSON.parse(
        Buffer.from(extraData || "", "base64").toString("utf8")
      );
      userId = decoded.userId;
    } catch {}

    if (!userId) return res.status(400).json({ message: "Missing userId in extraData" });

 
    const existed = await db.query(
      `SELECT status FROM wallet_transactions WHERE order_id=$1 LIMIT 1`,
      [orderId]
    );
    if (!existed.rows.length) return res.status(404).json({ message: "Order not found" });


    if (existed.rows[0].status === "success") {
      return res.json({ message: "already success" });
    }

    
    if (Number(resultCode) !== 0) {
      await db.query(
        `UPDATE wallet_transactions
         SET status='failed', trans_id=$1, note=$2
         WHERE order_id=$3`,
        [transId || null, message || "failed", orderId]
      );
      return res.json({ message: "failed recorded" });
    }


    await db.query("BEGIN");

    await db.query(
      `INSERT INTO wallets (user_id, balance)
       VALUES ($1, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    const upd = await db.query(
      `UPDATE wallet_transactions
       SET status='success', trans_id=$1, note=$2
       WHERE order_id=$3 AND status='pending'
       RETURNING amount`,
      [transId, `topup_momo`, orderId]
    );

    if (!upd.rows.length) {
      await db.query("ROLLBACK");
      return res.json({ message: "already processed" });
    }

    const addAmount = Number(upd.rows[0].amount || amount || 0);

    await db.query(
      `UPDATE wallets
       SET balance = balance + $1, updated_at=now()
       WHERE user_id=$2`,
      [addAmount, userId]
    );

    await db.query("COMMIT");
    return res.json({ message: "ok" });
  } catch (err) {
    await db.query("ROLLBACK").catch(() => {});
    console.error("MoMo return-confirm error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;