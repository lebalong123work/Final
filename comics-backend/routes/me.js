const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth } = require("../middleware/auth");
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const u = await db.query(
      `SELECT id, username, email, phone, provider, status
       FROM users
       WHERE id=$1
       LIMIT 1`,
      [userId]
    );
    if (!u.rows.length) return res.status(404).json({ message: "User không tồn tại" });

    const w = await db.query(
      `INSERT INTO wallets (user_id, balance)
       VALUES ($1, 0)
       ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
       RETURNING user_id, balance, updated_at`,
      [userId]
    );

    return res.json({ user: u.rows[0], wallet: w.rows[0] });
  } catch (err) {
    console.error("GET /api/me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;