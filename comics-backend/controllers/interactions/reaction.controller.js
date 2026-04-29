const ReactionModel = require("../../models/interactions/reaction.model");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

function normalizeText(v) { return String(v || "").trim(); }
function toInt(v, f = 0) { const n = Number(v); return Number.isFinite(n) ? n : f; }
function isValidComicType(t) { return t === "external" || t === "self"; }

function getOptionalUserId(req) {
  try {
    const raw = req.headers.authorization || "";
    const token = raw.replace("Bearer ", "").trim();
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    return Number(decoded?.id || 0) || null;
  } catch { return null; }
}

async function getChapterReactions(req, res) {
  try {
    const chapterId = normalizeText(req.params.chapterId);
    const comicId = toInt(req.query.comicId, 0);
    const comicType = normalizeText(req.query.comicType);
    if (!chapterId) return res.status(400).json({ message: "chapterId is required" });
    const data = await ReactionModel.getChapterReactions(chapterId, comicId, comicType, getOptionalUserId(req));
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/reactions/chapter/:chapterId error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function toggleReaction(req, res) {
  try {
    const userId = Number(req.user.id || 0);
    const chapterId = normalizeText(req.params.chapterId);
    const comicId = toInt(req.body.comicId, 0);
    const comicType = normalizeText(req.body.comicType);
    if (!chapterId) return res.status(400).json({ message: "chapterId is required" });
    if (!comicId) return res.status(400).json({ message: "Invalid comicId" });
    if (!isValidComicType(comicType)) return res.status(400).json({ message: "comicType must be external or self" });

    const result = await ReactionModel.toggleReaction(
      userId, chapterId, comicId, comicType,
      normalizeText(req.body.slug), normalizeText(req.body.chapApi), normalizeText(req.body.chapterTitle)
    );
    if (result.error) return res.status(result.error).json({ message: result.message });
    return res.json(result);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "This chapter was popular." });
    console.error("POST /api/reactions/chapter/:chapterId/toggle error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getComicReactions(req, res) {
  try {
    const comicType = normalizeText(req.params.comicType);
    const comicId = toInt(req.params.comicId, 0);
    if (!isValidComicType(comicType)) return res.status(400).json({ message: "comicType must be external or self" });
    if (!comicId) return res.status(400).json({ message: "comicId is invalid" });
    const data = await ReactionModel.getComicReactions(comicType, comicId, getOptionalUserId(req));
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/reactions/comic/:comicType/:comicId error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getMyLiked(req, res) {
  try {
    const comicType = normalizeText(req.params.comicType);
    const comicId = toInt(req.params.comicId, 0);
    if (!isValidComicType(comicType)) return res.status(400).json({ message: "comicType must be external or self" });
    if (!comicId) return res.status(400).json({ message: "comicId is invalid" });
    const liked = await ReactionModel.getMyLiked(Number(req.user.id), comicType, comicId);
    return res.json({ success: true, data: { liked } });
  } catch (err) {
    console.error("GET /api/reactions/my-liked error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getLibrary(req, res) {
  try {
    const data = await ReactionModel.getLibrary(Number(req.user.id));
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/reactions/library error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getTopComics(req, res) {
  try {
    const limit = Math.max(1, Math.min(20, Number(req.query.limit || 10)));
    const data = await ReactionModel.getTopComics(limit);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/reactions/top-comics error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getLatestLiked(req, res) {
  try {
    const limit = Math.max(1, Math.min(30, Number(req.query.limit || 12)));
    const data = await ReactionModel.getLatestLiked(limit);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/reactions/latest-liked error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getChapterReactions, toggleReaction, getComicReactions, getMyLiked, getLibrary, getTopComics, getLatestLiked };
