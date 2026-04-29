const CommentModel = require("../../models/interactions/comment.model");

function normalizeText(v) { return String(v || "").trim(); }
function toInt(v, fallback = 0) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }
function isValidChapterType(type) { return type === "external" || type === "self"; }

async function getMyStats(req, res) {
  try {
    const userId = Number(req.user.id);
    const data = await CommentModel.getMyCommentStats(userId);
    return res.json({ success: true, data });
  } catch (e) {
    console.error("GET /api/comments/me/stats error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getComments(req, res) {
  try {
    const chapterType = normalizeText(req.query.chapterType);
    const rawChapterId = normalizeText(req.query.chapterId);

    if (!isValidChapterType(chapterType))
      return res.status(400).json({ message: "chapterType must be external or self" });
    if (!rawChapterId)
      return res.status(400).json({ message: "chapterId is required" });

    let rows;
    if (chapterType === "external") {
      rows = await CommentModel.getCommentsByExternalChapter(rawChapterId);
    } else {
      const selfChapterId = toInt(rawChapterId, 0);
      if (!selfChapterId) return res.status(400).json({ message: "chapterId self is invalid" });
      rows = await CommentModel.getCommentsBySelfChapter(selfChapterId);
    }

    return res.json({ success: true, data: rows });
  } catch (e) {
    console.error("GET /api/comments error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

async function createComment(req, res) {
  try {
    const userId = req.user.id;
    const chapterType = normalizeText(req.body.chapterType);
    const rawChapterId = normalizeText(req.body.chapterId);
    const text = normalizeText(req.body.text);
    const parentId = req.body.parentId ? toInt(req.body.parentId, 0) : null;

    if (!isValidChapterType(chapterType))
      return res.status(400).json({ message: "chapterType must be external or self" });
    if (!rawChapterId) return res.status(400).json({ message: "chapterId is required" });
    if (!text) return res.status(400).json({ message: "text is required" });

    let comment;
    if (chapterType === "external") {
      comment = await CommentModel.createExternalComment(rawChapterId, userId, parentId, text);
    } else {
      const selfChapterId = toInt(rawChapterId, 0);
      if (!selfChapterId) return res.status(400).json({ message: "chapterId self is invalid" });
      comment = await CommentModel.createSelfComment(selfChapterId, userId, parentId, text);
    }

    const username = await CommentModel.getUsernameById(userId);
    return res.json({ success: true, data: { ...comment, user_id: userId, user_name: username } });
  } catch (e) {
    console.error("POST /api/comments error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deleteComment(req, res) {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";
    const id = toInt(req.params.id, 0);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const row = await CommentModel.findCommentById(id);
    if (!row) return res.status(404).json({ message: "Comment not found" });

    const isOwner = Number(row.user_id) === Number(userId);
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

    await CommentModel.deleteComment(id);

    const io = req.app.get("io");
    if (io) {
      const roomId = row.chapter_type === "external"
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
}

module.exports = { getMyStats, getComments, createComment, deleteComment };
