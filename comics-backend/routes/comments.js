const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth, requireAdmin } = require("../middleware/auth");

function normalizeText(v) {
  return String(v || "").trim();
}

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isValidChapterType(type) {
  return type === "external" || type === "self";
}

// ======================================================
// GET /api/comments?chapterType=external&chapterId=abc
// GET /api/comments?chapterType=self&chapterId=12
// ======================================================
router.get("/", async (req, res) => {
  try {
    const chapterType = normalizeText(req.query.chapterType);
    const rawChapterId = normalizeText(req.query.chapterId);

    if (!isValidChapterType(chapterType)) {
      return res.status(400).json({ message: "chapterType phải là external hoặc self" });
    }

    if (!rawChapterId) {
      return res.status(400).json({ message: "chapterId is required" });
    }

    let sql = "";
    let params = [];

    if (chapterType === "external") {
      sql = `
        SELECT
          c.id,
          c.chapter_type,
          c.external_chapter_id,
          c.self_chapter_id,
          c.parent_id,
          c.text,
          c.created_at,
          u.id AS user_id,
          u.username AS user_name
        FROM chapter_comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.chapter_type = 'external'
          AND c.external_chapter_id = $1
        ORDER BY c.created_at DESC
        LIMIT 300
      `;
      params = [rawChapterId];
    } else {
      const selfChapterId = toInt(rawChapterId, 0);
      if (!selfChapterId) {
        return res.status(400).json({ message: "chapterId self không hợp lệ" });
      }

      sql = `
        SELECT
          c.id,
          c.chapter_type,
          c.external_chapter_id,
          c.self_chapter_id,
          c.parent_id,
          c.text,
          c.created_at,
          u.id AS user_id,
          u.username AS user_name
        FROM chapter_comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.chapter_type = 'self'
          AND c.self_chapter_id = $1
        ORDER BY c.created_at DESC
        LIMIT 300
      `;
      params = [selfChapterId];
    }

    const r = await db.query(sql, params);
    return res.json({ success: true, data: r.rows });
  } catch (e) {
    console.error("GET /api/comments error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ======================================================
// POST /api/comments
// body:
// {
//   chapterType: "external" | "self",
//   chapterId: "abc" | 12,
//   text: "...",
//   parentId: null | 5
// }
// ======================================================
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const chapterType = normalizeText(req.body.chapterType);
    const rawChapterId = normalizeText(req.body.chapterId);
    const text = normalizeText(req.body.text);
    const parentId = req.body.parentId ? toInt(req.body.parentId, 0) : null;

    if (!isValidChapterType(chapterType)) {
      return res.status(400).json({ message: "chapterType phải là external hoặc self" });
    }

    if (!rawChapterId) {
      return res.status(400).json({ message: "chapterId is required" });
    }

    if (!text) {
      return res.status(400).json({ message: "text is required" });
    }

    let insertSql = "";
    let insertParams = [];

    if (chapterType === "external") {
      insertSql = `
        INSERT INTO chapter_comments (
          chapter_type,
          external_chapter_id,
          user_id,
          parent_id,
          text
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, chapter_type, external_chapter_id, self_chapter_id, parent_id, text, created_at
      `;
      insertParams = ["external", rawChapterId, userId, parentId || null, text];
    } else {
      const selfChapterId = toInt(rawChapterId, 0);
      if (!selfChapterId) {
        return res.status(400).json({ message: "chapterId self không hợp lệ" });
      }

      insertSql = `
        INSERT INTO chapter_comments (
          chapter_type,
          self_chapter_id,
          user_id,
          parent_id,
          text
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, chapter_type, external_chapter_id, self_chapter_id, parent_id, text, created_at
      `;
      insertParams = ["self", selfChapterId, userId, parentId || null, text];
    }

    const r = await db.query(insertSql, insertParams);

    const u = await db.query(`SELECT username FROM users WHERE id = $1`, [userId]);

    return res.json({
      success: true,
      data: {
        ...r.rows[0],
        user_id: userId,
        user_name: u.rows[0]?.username || "User",
      },
    });
  } catch (e) {
    console.error("POST /api/comments error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ======================================================
// DELETE /api/comments/:id
// admin hoặc chủ comment
// ======================================================
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    const id = toInt(req.params.id, 0);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const r = await db.query(
      `
      SELECT
        id,
        user_id,
        chapter_type,
        external_chapter_id,
        self_chapter_id
      FROM chapter_comments
      WHERE id = $1
      `,
      [id]
    );

    const row = r.rows[0];
    if (!row) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const isOwner = Number(row.user_id) === Number(userId);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await db.query(`DELETE FROM chapter_comments WHERE id = $1`, [id]);

    const io = req.app.get("io");
    if (io) {
      const roomId =
        row.chapter_type === "external"
          ? row.external_chapter_id
          : String(row.self_chapter_id);

      io.to(`chapter:${row.chapter_type}:${roomId}`).emit("comment:deleted", {
        chapterType: row.chapter_type,
        chapterId: roomId,
        commentId: id,
      });
    }

    return res.json({ success: true, data: { id } });
  } catch (e) {
    console.error("DELETE /api/comments/:id error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;