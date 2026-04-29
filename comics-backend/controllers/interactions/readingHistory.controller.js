const ReadingHistoryModel = require("../../models/interactions/readingHistory.model");

function toInt(v, f = 0) { const n = Number(v); return Number.isFinite(n) ? n : f; }
function normalizeText(v) { return String(v || "").trim(); }
function isValidComicType(t) { return t === "external" || t === "self"; }

async function mark(req, res) {
  try {
    const userId = req.user.id;
    const comicType = normalizeText(req.body.comicType);
    const comicId = toInt(req.body.comicId, 0);
    const rawChapterId = req.body.chapterId;

    if (!isValidComicType(comicType)) return res.status(400).json({ message: "comicType must be external or self" });
    if (!comicId) return res.status(400).json({ message: "comicId is invalid" });
    if (rawChapterId === undefined || rawChapterId === null || rawChapterId === "") return res.status(400).json({ message: "chapterId is invalid" });

    let result;
    if (comicType === "self") {
      const selfChapterId = toInt(rawChapterId, 0);
      if (!selfChapterId) return res.status(400).json({ message: "self chapterId is invalid" });
      result = await ReadingHistoryModel.markSelf(userId, comicId, selfChapterId);
    } else {
      const externalChapterId = normalizeText(rawChapterId);
      if (!externalChapterId) return res.status(400).json({ message: "external chapterId is invalid" });
      result = await ReadingHistoryModel.markExternal(userId, comicId, externalChapterId, normalizeText(req.body.chapterApi), normalizeText(req.body.chapterTitle));
    }

    if (result.error) return res.status(result.error).json({ message: result.message });
    return res.json(result);
  } catch (err) {
    console.error("POST /api/reading-history/mark error:", err);
    return res.status(500).json({ message: "Server error when saving reading history" });
  }
}

async function getByComic(req, res) {
  try {
    const comicType = normalizeText(req.params.comicType);
    const comicId = toInt(req.params.comicId, 0);
    if (!isValidComicType(comicType)) return res.status(400).json({ message: "comicType must be external or self" });
    if (!comicId) return res.status(400).json({ message: "comicId is invalid" });
    const data = await ReadingHistoryModel.getByComic(req.user.id, comicType, comicId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET reading-history/comic error:", err);
    return res.status(500).json({ message: "Server error when fetching read chapters" });
  }
}

async function getStats(req, res) {
  try {
    const data = await ReadingHistoryModel.getStats(req.user.id);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET reading-history/stats error:", err);
    return res.status(500).json({ message: "Server error when fetching statistics" });
  }
}

async function getLibrary(req, res) {
  try {
    const data = await ReadingHistoryModel.getLibrary(req.user.id);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET reading-history/library error:", err);
    return res.status(500).json({ message: "Server error when fetching library" });
  }
}

async function getTopComics(req, res) {
  try {
    const limit = Math.max(1, Math.min(20, Number(req.query.limit || 3)));
    const data = await ReadingHistoryModel.getTopComics(limit);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET reading-history/top-comics error:", err);
    return res.status(500).json({ message: "Server error when fetching top comics" });
  }
}

module.exports = { mark, getByComic, getStats, getLibrary, getTopComics };
