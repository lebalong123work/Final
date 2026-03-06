const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth } = require("../middleware/auth");

// GET /api/notifications
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const r = await db.query(
      `
      SELECT n.*, u.username AS actor_username
      FROM notifications n
      LEFT JOIN users u ON u.id = n.actor_user_id
      WHERE n.user_id=$1
      ORDER BY n.created_at DESC
      LIMIT 50
      `,
      [userId]
    );

    res.json({ success: true, data: r.rows });
  } catch (e) {
    console.error("get notifications error", e);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/notifications/unread-count
router.get("/unread-count", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const r = await db.query(
      `SELECT COUNT(*)::int AS unread FROM notifications WHERE user_id=$1 AND read_at IS NULL`,
      [userId]
    );
    res.json({ success: true, data: { unread: r.rows[0]?.unread || 0 } });
  } catch (e) {
    console.error("unread count error", e);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/notifications/:id/read
router.post("/:id/read", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);

    await db.query(`UPDATE notifications SET read_at=NOW() WHERE id=$1 AND user_id=$2`, [id, userId]);

    const cnt = await db.query(
      `SELECT COUNT(*)::int AS unread FROM notifications WHERE user_id=$1 AND read_at IS NULL`,
      [userId]
    );

   
    const io = req.app.get("io");
    io?.to(`user:${userId}`).emit("notif:unread", { unread: cnt.rows[0]?.unread || 0 });

    res.json({ success: true, data: { unread: cnt.rows[0]?.unread || 0 } });
  } catch (e) {
    console.error("mark read error", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;