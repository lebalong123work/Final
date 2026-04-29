const PurchaseModel = require("../../models/finance/purchase.model");

function toInt(v, f = 0) { const n = Number(v); return Number.isFinite(n) ? n : f; }

async function checkAccessExternal(req, res) {
  try {
    const result = await PurchaseModel.checkAccessExternal(req.user.id, req.params.slug);
    if (!result) return res.status(404).json({ message: "No comic found" });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("access external error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function checkAccessSelf(req, res) {
  try {
    const comicId = toInt(req.params.id, 0);
    if (!comicId) return res.status(400).json({ message: "Invalid comic ID" });
    const result = await PurchaseModel.checkAccessSelf(req.user.id, comicId);
    if (!result) return res.status(404).json({ message: "Comic not found" });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("access self error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function buyExternal(req, res) {
  try {
    const result = await PurchaseModel.buyExternal(req.user.id, req.params.slug);
    if (result.error) return res.status(result.error).json({ message: result.message, balance: result.balance, price: result.price });
    return res.json({ success: true, message: "Buy external comic successful", data: result.data });
  } catch (err) {
    console.error("buy external comic error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function buySelf(req, res) {
  try {
    const comicId = toInt(req.params.id, 0);
    if (!comicId) return res.status(400).json({ message: "Invalid comic ID" });
    const result = await PurchaseModel.buySelf(req.user.id, comicId);
    if (result.error) return res.status(result.error).json({ message: result.message, balance: result.balance, price: result.price });
    return res.json({ success: true, message: "Buy self comic successful", data: result.data });
  } catch (err) {
    console.error("buy self comic error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { checkAccessExternal, checkAccessSelf, buyExternal, buySelf };
