const express = require("express");
const router = express.Router();
const https = require("https");
const crypto = require("crypto");
const db = require("../db");
const { auth } = require("../middleware/auth");

function hmacSHA256(secret, raw) {
  return crypto.createHmac("sha256", secret).update(raw).digest("hex");
}

function postJson(url, bodyObj) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(bodyObj);
    const u = new URL(url);

    const req = https.request(
      {
        hostname: u.hostname,
        port: 443,
        path: u.pathname + (u.search || ""),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(raw) });
          } catch {
            reject(new Error("MoMo response parse error: " + raw));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// POST 
router.post("/topup/momo", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const amount = Number(req.body.amount || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Số tiền không hợp lệ" });
    }

    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretkey = process.env.MOMO_SECRET_KEY;

    const endpoint = process.env.MOMO_CREATE_ENDPOINT;
    const redirectUrl = process.env.MOMO_REDIRECT_URL;
    const ipnUrl = process.env.MOMO_IPN_URL;

   
    const requestId = `${partnerCode}${Date.now()}`;
    const orderId = requestId;

    const orderInfo = `Topup wallet user=${userId}`;
    const requestType = "payWithMethod";


    const extraData = Buffer.from(JSON.stringify({ userId })).toString("base64");

 
    await db.query(
      `INSERT INTO wallet_transactions (user_id, type, amount, note, order_id, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [userId, "nạp tiền momo", amount, "Đang chờ thanh toán", orderId]
    );

    
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = hmacSHA256(secretkey, rawSignature);

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount: String(amount),
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: "vi",
    };

    const momoRes = await postJson(endpoint, requestBody);

   
    if (momoRes.statusCode !== 200 || momoRes.body?.resultCode !== 0) {
      await db.query(
        `UPDATE wallet_transactions
         SET status='failed', note=$1
         WHERE order_id=$2`,
        [momoRes.body?.message || "Create MoMo failed", orderId]
      );

      return res.status(400).json({
        message: momoRes.body?.message || "Tạo thanh toán MoMo thất bại",
        momo: momoRes.body,
      });
    }

    return res.json({
      orderId,
      requestId,
      payUrl: momoRes.body.payUrl,
      deeplink: momoRes.body.deeplink,
      qrCodeUrl: momoRes.body.qrCodeUrl,
    });
  } catch (err) {
    
    console.error("POST /wallet/topup/momo error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


router.get("/topup/status/:orderId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const r = await db.query(
      `SELECT id, order_id, amount, status, trans_id, created_at
       FROM wallet_transactions
       WHERE user_id=$1 AND order_id=$2
       LIMIT 1`,
      [userId, orderId]
    );

    if (!r.rows.length) return res.status(404).json({ message: "Không tìm thấy giao dịch" });
    return res.json({ data: r.rows[0] });
  } catch (err) {
    console.error("GET /wallet/topup/status error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/wallet/transactions?page=1&limit=5
router.get("/transactions", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 5)));
    const offset = (page - 1) * limit;

    // total
    const totalRes = await db.query(
      `SELECT COUNT(*)::int AS total
       FROM wallet_transactions
       WHERE user_id = $1`,
      [userId]
    );
    const total = totalRes.rows[0].total;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // data
    const result = await db.query(
      `SELECT id, type, amount, note, order_id, trans_id, status, created_at
       FROM wallet_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return res.json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      data: result.rows,
    });
  } catch (err) {
    console.error("Get transactions error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;