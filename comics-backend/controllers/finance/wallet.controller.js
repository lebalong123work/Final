const crypto = require("crypto");
const https = require("https");
const WalletModel = require("../../models/finance/wallet.model");

function hmacSHA256(secret, raw) {
  return crypto.createHmac("sha256", secret).update(raw).digest("hex");
}

  function postJson(url, bodyObj) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(bodyObj);
      const u = new URL(url);
      const req = https.request(
        { hostname: u.hostname, port: 443, path: u.pathname + (u.search || ""), method: "POST",
          headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } },
        (res) => {
          let raw = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => (raw += chunk));
          res.on("end", () => {
            try { resolve({ statusCode: res.statusCode, body: JSON.parse(raw) }); }
            catch { reject(new Error("MoMo response parse error: " + raw)); }
          });
        }
      );
      req.setTimeout(10000, () => {
        req.destroy(new Error("MoMo request timeout after 10s"));
      });
      req.on("error", reject);
      req.write(data);
      req.end();
    });
  }

async function createMomoTopup(req, res) {
  try {
    const userId = req.user.id;
    const amount = Number(req.body.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0)
      return res.status(400).json({ message: "Invalid amount" });

    const { MOMO_PARTNER_CODE: partnerCode, MOMO_ACCESS_KEY: accessKey,
            MOMO_SECRET_KEY: secretkey, MOMO_CREATE_ENDPOINT: endpoint,
            MOMO_REDIRECT_URL: redirectUrl, MOMO_IPN_URL: ipnUrl } = process.env;

    const requestId = `${partnerCode}${Date.now()}`;
    const orderId = requestId;
    const orderInfo = `Topup wallet user=${userId}`;
    const requestType = "payWithMethod";
    const extraData = Buffer.from(JSON.stringify({ userId })).toString("base64");

    await WalletModel.createPendingTransaction(userId, "top up momo", amount, "Awaiting payment", orderId);

    const rawSignature =
      `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}` +
      `&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = hmacSHA256(secretkey, rawSignature);
    const requestBody = { partnerCode, accessKey, requestId, amount: String(amount),
      orderId, orderInfo, redirectUrl, ipnUrl, extraData, requestType, signature, lang: "vi" };

    const momoRes = await postJson(endpoint, requestBody);
    if (momoRes.statusCode !== 200 || momoRes.body?.resultCode !== 0) {
      await WalletModel.failTransaction(orderId, momoRes.body?.message || "Create MoMo failed");
      return res.status(400).json({ message: momoRes.body?.message || "MoMo payment creation failed.", momo: momoRes.body });
    }

    return res.json({ orderId, requestId, payUrl: momoRes.body.payUrl,
      deeplink: momoRes.body.deeplink, qrCodeUrl: momoRes.body.qrCodeUrl });
  } catch (err) {
    console.error("POST /wallet/topup/momo error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getTopupStatus(req, res) {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const tx = await WalletModel.getTransactionStatus(userId, orderId);
    if (!tx) return res.status(404).json({ message: "No transaction found." });
    return res.json({ data: tx });
  } catch (err) {
    console.error("GET /wallet/topup/status error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getTransactions(req, res) {
  try {
    const userId = req.user.id;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 5)));
    const { total, totalPages, rows } = await WalletModel.getTransactionsPaged(userId, page, limit);
    return res.json({ success: true, page, limit, total, totalPages, data: rows });
  } catch (err) {
    console.error("Get transactions error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { createMomoTopup, getTopupStatus, getTransactions };
