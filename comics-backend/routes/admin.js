const express = require("express");
const db = require("../db");
const { auth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * PUT /api/admin/users/:id/role
 * body: { roleCode: "admin" | "user" | "..." }
 */
router.put("/users/:id/role", auth, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { roleCode } = req.body || {};
    if (!roleCode) return res.status(400).json({ message: "Thiếu roleCode" });

    const role = await db.query(`SELECT id FROM roles WHERE code=$1 LIMIT 1`, [roleCode]);
    if (!role.rows.length) return res.status(404).json({ message: "Role không tồn tại" });

    await db.query(`UPDATE users SET role_id=$1 WHERE id=$2`, [role.rows[0].id, userId]);

    return res.json({ message: "Đổi quyền thành công" });
  } catch (err) {
    console.error("change role error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
