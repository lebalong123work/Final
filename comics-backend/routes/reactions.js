const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth } = require("../middleware/auth");


router.get("/chapter/:chapterId", async (req, res) => {
  try {
    const chapterId = (req.params.chapterId || "").trim();
    if (!chapterId) return res.status(400).json({ message: "chapterId is required" });

    const token = (req.headers.authorization || "").replace("Bearer ", "").trim();

    // đếm tổng like
    const c = await db.query(
      `SELECT COUNT(*)::int AS cnt FROM chapter_reactions WHERE chapter_id=$1`,
      [chapterId]
    );

    let liked = false;

   
    if (token) {
      
      liked = false;
    }

    return res.json({ success: true, data: { likeCount: c.rows[0]?.cnt || 0, liked } });
  } catch (e) {
    console.error("GET reactions error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});


router.post("/chapter/:chapterId/toggle", auth, async (req, res) => {
  const client = await db.connect();
  try {
    const userId = req.user.id;
    const chapterId = (req.params.chapterId || "").trim();
    if (!chapterId) return res.status(400).json({ message: "chapterId is required" });

    await client.query("BEGIN");

    // check đã like chưa
    const existed = await client.query(
      `SELECT id FROM chapter_reactions WHERE chapter_id=$1 AND user_id=$2`,
      [chapterId, userId]
    );

    let liked;
    if (existed.rows.length) {
      await client.query(
        `DELETE FROM chapter_reactions WHERE chapter_id=$1 AND user_id=$2`,
        [chapterId, userId]
      );
      liked = false;
    } else {
      await client.query(
        `INSERT INTO chapter_reactions (chapter_id, user_id) VALUES ($1,$2)`,
        [chapterId, userId]
      );
      liked = true;
    }

    const cnt = await client.query(
      `SELECT COUNT(*)::int AS cnt FROM chapter_reactions WHERE chapter_id=$1`,
      [chapterId]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      data: { liked, likeCount: cnt.rows[0]?.cnt || 0 },
    });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("POST toggle reaction error:", e);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

module.exports = router;