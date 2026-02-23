const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth , requireAdmin } = require("../middleware/auth");


router.get("/", async (req, res) => {
  try {
    const chapterId = (req.query.chapterId || "").trim();
    if (!chapterId) return res.status(400).json({ message: "chapterId is required" });

    const r = await db.query(
      `
      SELECT
        c.id,
        c.chapter_id,
        c.parent_id,
        c.text,
        c.created_at,
        u.id AS user_id,
        u.username AS user_name
      FROM chapter_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.chapter_id = $1
      ORDER BY c.created_at DESC
      LIMIT 300
      `,
      [chapterId]
    );

    return res.json({ success: true, data: r.rows });
  } catch (e) {
    console.error("GET /api/comments error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});


router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const chapterId = (req.body.chapterId || "").trim();
    const text = (req.body.text || "").trim();
    const parentId = req.body.parentId || null;

    if (!chapterId) return res.status(400).json({ message: "chapterId is required" });
    if (!text) return res.status(400).json({ message: "text is required" });

    const r = await db.query(
      `
      INSERT INTO chapter_comments (chapter_id, user_id, parent_id, text)
      VALUES ($1,$2,$3,$4)
      RETURNING id, chapter_id, parent_id, text, created_at
      `,
      [chapterId, userId, parentId, text]
    );

    // lấy username để trả về giống socket format
    const u = await db.query(`SELECT username FROM users WHERE id=$1`, [userId]);

    return res.json({
      success: true,
      data: { ...r.rows[0], user_id: userId, user_name: u.rows[0]?.username || "User" },
    });
  } catch (e) {
    console.error("POST /api/comments error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", requireAdmin , async (req, res) => {
  try {
    const userId = req.user.id; 
    const isAdmin = req.user.role === "admin";

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const r = await db.query(
      `SELECT id, user_id, chapter_id FROM chapter_comments WHERE id=$1`,
      [id]
    );
    const row = r.rows[0];
    if (!row) return res.status(404).json({ message: "Comment not found" });

    const isOwner = Number(row.user_id) === Number(userId);
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

    await db.query(`DELETE FROM chapter_comments WHERE id=$1`, [id]);

   
    const chapterId = row.chapter_id;
    const io = req.app.get("io");
    if (io) {
      io.to(`chapter:${chapterId}`).emit("comment:deleted", {
        chapterId,
        commentId: id,
      });
    }

    res.json({ status: "success", data: { id } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;