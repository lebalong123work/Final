const RatingModel = require("../../models/interactions/rating.model");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

function toInt(v, f = 0) { const n = Number(v); return Number.isFinite(n) ? n : f; }
function isValidComicType(t) { return t === "external" || t === "self"; }

function getOptionalUserId(req) {
  try {
    const raw = req.headers.authorization || "";
    const token = raw.replace("Bearer ", "").trim();
    if (!token) return null;
    const payload = jwt.verify(token, JWT_SECRET);
    return Number(payload?.id || 0) || null;
  } catch { return null; }
}

async function getSummary(req, res) {
  try {
    const comicType = String(req.params.comicType || "").trim();
    const comicId = toInt(req.params.comicId, 0);
    if (!isValidComicType(comicType)) return res.status(400).json({ message: "comicType must be external or self" });
    if (!comicId) return res.status(400).json({ message: "comicId is invalid" });

    const comic = await RatingModel.ensureComicExists(comicType, comicId);
    if (!comic) return res.status(404).json({ message: "Comic not found" });

    const summary = await RatingModel.getSummary(comicType, comicId);
    const mine = await RatingModel.getMyRating(comicType, comicId, getOptionalUserId(req));
    return res.json({ data: { comic_type: comicType, comic_id: comicId, summary, mine } });
  } catch (err) {
    console.error("GET rating summary error:", err);
    return res.status(500).json({ message: "Server error when fetching rating" });
  }
}

async function getMyRating(req, res) {
  try {
    const comicType = String(req.params.comicType || "").trim();
    const comicId = toInt(req.params.comicId, 0);
    if (!isValidComicType(comicType)) return res.status(400).json({ message: "comicType must be external or self" });
    if (!comicId) return res.status(400).json({ message: "comicId is invalid" });
    const rating = await RatingModel.getMyRating(comicType, comicId, req.user.id);
    return res.json({ data: { rating } });
  } catch (err) {
    console.error("GET my rating error:", err);
    return res.status(500).json({ message: "Server error when fetching your rating" });
  }
}

async function upsertRating(req, res) {
  try {
    const comicType = String(req.params.comicType || "").trim();
    const comicId = toInt(req.params.comicId, 0);
    const rating = Number(req.body.rating);
    if (!isValidComicType(comicType)) return res.status(400).json({ message: "comicType must be external or self" });
    if (!comicId) return res.status(400).json({ message: "comicId is invalid" });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: "rating must be an integer between 1 and 5" });

    const comic = await RatingModel.ensureComicExists(comicType, comicId);
    if (!comic) return res.status(404).json({ message: "Comic not found" });

    const summary = await RatingModel.upsertRating(comicType, comicId, req.user.id, rating);
    return res.json({ data: { comic_type: comicType, comic_id: comicId, rating, summary } });
  } catch (err) {
    console.error("POST rating error:", err);
    return res.status(500).json({ message: "Server error when submitting rating" });
  }
}

module.exports = { getSummary, getMyRating, upsertRating };
