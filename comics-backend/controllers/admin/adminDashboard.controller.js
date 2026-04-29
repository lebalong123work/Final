const AdminDashboardModel = require("../../models/admin/adminDashboard.model");

async function getDashboard(req, res) {
  try {
    const result = await AdminDashboardModel.getDashboard(req.query.range);
    return res.json({ success: true, range: result.range, data: { traffic: result.traffic, revenue: result.revenue, users: result.users, orders: result.orders, top_comics: result.top_comics } });
  } catch (err) {
    console.error("GET /api/admin/dashboard error:", err);
    return res.status(500).json({ message: "Server error when retrieving dashboard" });
  }
}

module.exports = { getDashboard };
