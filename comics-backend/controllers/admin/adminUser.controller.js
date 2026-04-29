const AdminUserModel = require("../../models/admin/adminUser.model");

async function listUsers(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const q = String(req.query.q || "").trim();

    const { total, totalPages, rows } = await AdminUserModel.listUsers({ page, limit, q });
    return res.json({ success: true, data: rows, page, limit, total, totalPages });
  } catch (e) {
    console.error("GET admin users error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateUserStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const status = Number(req.body?.status);

    if (!id) return res.status(400).json({ message: "id invalid" });
    if (![0, 1].includes(status)) return res.status(400).json({ message: "status must be 0 or 1" });

    const user = await AdminUserModel.updateUserStatus(id, status);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ success: true, data: user });
  } catch (e) {
    console.error("PATCH user status error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateUserInfo(req, res) {
  try {
    const id = Number(req.params.id);
    const { username, phone } = req.body || {};
    if (!id) return res.status(400).json({ message: "id invalid" });

    const user = await AdminUserModel.updateUserInfo(id, username, phone);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ success: true, data: user });
  } catch (e) {
    console.error("PATCH user info error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateUserRole(req, res) {
  try {
    const id = Number(req.params.id);
    const role = String(req.body?.role || "").trim();

    if (!id) return res.status(400).json({ message: "id invalid" });
    if (!role) return res.status(400).json({ message: "Lack of roles" });

    const allow = ["user", "sub_admin", "admin"];
    if (!allow.includes(role)) return res.status(400).json({ message: "Role is not valid" });

    const roleRow = await AdminUserModel.findRoleByCode(role);
    if (!roleRow) return res.status(404).json({ message: `Role not found: ${role}` });

    const updated = await AdminUserModel.updateUserRole(id, roleRow.id);
    if (!updated) return res.status(404).json({ message: "User not found" });

    const user = await AdminUserModel.getUserWithRole(id);
    return res.json({ success: true, data: user });
  } catch (e) {
    console.error("set user role error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { listUsers, updateUserStatus, updateUserInfo, updateUserRole };
