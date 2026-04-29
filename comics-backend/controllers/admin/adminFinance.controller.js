const AdminFinanceModel = require("../../models/admin/adminFinance.model");

async function getOverview(req, res) {
  try {
    const data = await AdminFinanceModel.getOverview();
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET finance overview error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getTopups(req, res) {
  try {
    const page  = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
    const q      = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim();
    const from   = String(req.query.from || "").trim();
    const to     = String(req.query.to || "").trim();
    const { total, totalPages, rows } = await AdminFinanceModel.getTopups(page, limit, q, status, from, to);
    return res.json({ success: true, page, limit, total, totalPages, data: rows });
  } catch (err) {
    console.error("Admin get topups error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getAllTransactions(req, res) {
  try {
    const page  = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 5)));
    const { total, totalPages, rows } = await AdminFinanceModel.getAllTransactions(page, limit);
    return res.json({ success: true, page, limit, total, totalPages, data: rows });
  } catch (err) {
    console.error("Admin get transactions error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getOverview, getTopups, getAllTransactions };
