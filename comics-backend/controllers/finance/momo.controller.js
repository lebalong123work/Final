const crypto = require("crypto");
const MomoModel = require("../../models/finance/momo.model");

function hmacSHA256(secret, raw) {
  return crypto.createHmac("sha256", secret).update(raw).digest("hex");
}

/**
* POST /api/momo/return-confirm
* IPN webhook receives payment results from MoMo.
* DO NOT change the HMAC-SHA256 signature authentication logic.
*/
async function returnConfirm(req, res) {
  try {
    const secretkey = process.env.MOMO_SECRET_KEY;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const {
      partnerCode, orderId, requestId, amount, orderInfo, orderType,
      transId, resultCode, message, payType, responseTime, extraData, signature,
    } = req.body;

// Verify signature — keep the field order of MoMo
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

// Decode userId from extraData (base64 JSON)
    let userId = null;
    try {
      const decoded = JSON.parse(Buffer.from(extraData || "", "base64").toString("utf8"));
      userId = decoded.userId;
    } catch { /* ignore */ }
    if (!userId) return res.status(400).json({ message: "Missing userId in extraData" });

    const result = await MomoModel.verifyAndProcess({ orderId, transId, resultCode, amount, userId });
    if (result.error) return res.status(result.error).json({ status: "failed", message: result.message });
    if (result.alreadyDone) return res.json({ status: "already", message: "already processed" });
    if (Number(resultCode) !== 0) return res.json({ status: "failed", message: "Payment failed" });
    return res.json({ status: "success", message: "ok" });
  } catch (err) {
    console.error("MoMo return-confirm error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { returnConfirm };
