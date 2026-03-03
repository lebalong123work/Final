const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth, requireAdmin } = require("../middleware/auth");

/**
 * GET /api/admin/users
 * query:
 *  - page (default 1)
 *  - limit (default 20)
 *  - q (search username/email/phone)
 */
router.get("/users", auth, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const offset = (page - 1) * limit;
    const q = String(req.query.q || "").trim();

    const params = [];
    let where = "";

    if (q) {
      params.push(`%${q}%`);
      where = `WHERE (u.username ILIKE $${params.length}
                 OR u.email ILIKE $${params.length}
                 OR u.phone ILIKE $${params.length})`;
    }

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM users u
      ${where}
    `;
    const countR = await db.query(countSql, params);
    const total = countR.rows[0]?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const listSql = `
      SELECT
        u.id, u.username, u.email, u.phone,
        u.provider, u.google_id,
        u.status, u.created_at,
        r.code AS role_code
      FROM users u
      JOIN roles r ON r.id = u.role_id
      ${where}
      ORDER BY u.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const listR = await db.query(listSql, params);

    res.json({
      success: true,
      data: listR.rows,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (e) {
    console.error("GET admin users error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * body: { status: 0 | 1 }
 */
router.patch("/users/:id/status", auth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = Number(req.body?.status);

    if (!id) return res.status(400).json({ message: "id invalid" });
    if (![0, 1].includes(status)) return res.status(400).json({ message: "status must be 0 or 1" });

    const r = await db.query(
      `UPDATE users
       SET status=$1
       WHERE id=$2
       RETURNING id, username, email, provider, status`,
      [status, id]
    );

    if (!r.rows.length) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, data: r.rows[0] });
  } catch (e) {
    console.error("PATCH user status error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PATCH /api/admin/users/:id
 * (tuỳ chọn) cập nhật thông tin user
 * body: { username, phone }
 */
router.patch("/users/:id", auth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username, phone } = req.body || {};
    if (!id) return res.status(400).json({ message: "id invalid" });

    const r = await db.query(
      `UPDATE users
       SET username = COALESCE($1, username),
           phone = COALESCE($2, phone)
       WHERE id=$3
       RETURNING id, username, email, phone, provider, status`,
      [username ?? null, phone ?? null, id]
    );

    if (!r.rows.length) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, data: r.rows[0] });
  } catch (e) {
    console.error("PATCH user info error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * body: { role: "user" | "sub_admin" | "admin" }
 */
router.patch("/users/:id/role", auth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const role = String(req.body?.role || "").trim();

    if (!id) return res.status(400).json({ message: "id invalid" });
    if (!role) return res.status(400).json({ message: "Thiếu role" });

    // Chỉ cho set trong whitelist
    const allow = ["user", "sub_admin", "admin"];
    if (!allow.includes(role)) {
      return res.status(400).json({ message: "Role không hợp lệ" });
    }

    // lấy role_id
    const rr = await db.query(`SELECT id, code FROM roles WHERE code=$1 LIMIT 1`, [role]);
    const roleId = rr.rows[0]?.id;
    if (!roleId) return res.status(404).json({ message: `Không tìm thấy role: ${role}` });

    // update user role
    const r = await db.query(
      `UPDATE users
       SET role_id=$1
       WHERE id=$2
       RETURNING id, username, email, provider, status, role_id`,
      [roleId, id]
    );
    if (!r.rows.length) return res.status(404).json({ message: "User không tồn tại" });

    // trả về kèm role_code cho dễ dùng FE
    const u = await db.query(
      `SELECT u.id, u.username, u.email, r.code AS role_code
       FROM users u JOIN roles r ON r.id=u.role_id
       WHERE u.id=$1`,
      [id]
    );

    return res.json({ success: true, data: u.rows[0] });
  } catch (e) {
    console.error("set user role error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;