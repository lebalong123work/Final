const express = require("express");
const db = require("../db");
const { auth, requireAdmin } = require("../middleware/auth");

const router = express.Router();


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

router.get("/wallet/transactions", auth, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 5)));
    const offset = (page - 1) * limit;

    // total tất cả giao dịch
    const totalRes = await db.query(
      `SELECT COUNT(*)::int AS total
       FROM wallet_transactions`
    );
    const total = totalRes.rows[0]?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    
    const result = await db.query(
      `SELECT wt.id, wt.user_id, u.username, u.email,
              wt.type, wt.amount, wt.note, wt.order_id, wt.trans_id, wt.status, wt.created_at
       FROM wallet_transactions wt
       LEFT JOIN users u ON u.id = wt.user_id
       ORDER BY wt.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
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
    console.error("Admin get transactions error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
