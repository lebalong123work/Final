const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth } = require("../middleware/auth");

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isValidComicType(type) {
  return type === "external" || type === "self";
}

async function ensureComicExists(comicType, comicId) {
  if (comicType === "external") {
    const r = await db.query(
      `SELECT id, slug, name FROM external_comics WHERE id = $1 LIMIT 1`,
      [comicId]
    );
    return r.rows[0] || null;
  }

  if (comicType === "self") {
    const r = await db.query(
      `SELECT id, title FROM self_comics WHERE id = $1 LIMIT 1`,
      [comicId]
    );
    return r.rows[0] || null;
  }

  return null;
}

/**
 * GET /api/comic-ratings/:comicType/:comicId
 * public summary
 * auth thì trả thêm mine nếu có token hợp lệ
 */
router.get("/:comicType/:comicId", async (req, res) => {
  try {
    const comicType = String(req.params.comicType || "").trim();
    const comicId = toInt(req.params.comicId, 0);

    if (!isValidComicType(comicType)) {
      return res.status(400).json({ message: "comicType phải là external hoặc self" });
    }

    if (!comicId) {
      return res.status(400).json({ message: "comicId không hợp lệ" });
    }

    const comic = await ensureComicExists(comicType, comicId);
    if (!comic) {
      return res.status(404).json({ message: "Không tìm thấy truyện" });
    }

    const summaryResult = await db.query(
      `
      SELECT
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float AS avg,
        COUNT(*)::int AS count
      FROM comic_ratings
      WHERE comic_type = $1 AND comic_id = $2
      `,
      [comicType, comicId]
    );

    let mine = 0;

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (token) {
      try {
        const jwt = require("jsonwebtoken");
        const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";
        const payload = jwt.verify(token, JWT_SECRET);

        const mineResult = await db.query(
          `
          SELECT rating
          FROM comic_ratings
          WHERE comic_type = $1 AND comic_id = $2 AND user_id = $3
          LIMIT 1
          `,
          [comicType, comicId, payload.id]
        );

        mine = mineResult.rows[0]?.rating || 0;
      } catch {
        mine = 0;
      }
    }

    return res.json({
      data: {
        comic_type: comicType,
        comic_id: comicId,
        summary: summaryResult.rows[0] || { avg: 0, count: 0 },
        mine,
      },
    });
  } catch (err) {
    console.error("GET /api/comic-ratings/:comicType/:comicId error:", err);
    return res.status(500).json({ message: "Lỗi server khi lấy rating" });
  }
});

/**
 * GET /api/comic-ratings/:comicType/:comicId/mine
 * cần login
 */
router.get("/:comicType/:comicId/mine", auth, async (req, res) => {
  try {
    const comicType = String(req.params.comicType || "").trim();
    const comicId = toInt(req.params.comicId, 0);
    const userId = req.user.id;

    if (!isValidComicType(comicType)) {
      return res.status(400).json({ message: "comicType phải là external hoặc self" });
    }

    if (!comicId) {
      return res.status(400).json({ message: "comicId không hợp lệ" });
    }

    const r = await db.query(
      `
      SELECT rating
      FROM comic_ratings
      WHERE comic_type = $1 AND comic_id = $2 AND user_id = $3
      LIMIT 1
      `,
      [comicType, comicId, userId]
    );

    return res.json({
      data: {
        rating: r.rows[0]?.rating || 0,
      },
    });
  } catch (err) {
    console.error("GET /api/comic-ratings/:comicType/:comicId/mine error:", err);
    return res.status(500).json({ message: "Lỗi server khi lấy rating của bạn" });
  }
});

/**
 * POST /api/comic-ratings/:comicType/:comicId
 * body: { rating: 1..5 }
 * upsert rating
 */
router.post("/:comicType/:comicId", auth, async (req, res) => {
  try {
    const comicType = String(req.params.comicType || "").trim();
    const comicId = toInt(req.params.comicId, 0);
    const userId = req.user.id;
    const rating = Number(req.body.rating);

    if (!isValidComicType(comicType)) {
      return res.status(400).json({ message: "comicType phải là external hoặc self" });
    }

    if (!comicId) {
      return res.status(400).json({ message: "comicId không hợp lệ" });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating phải từ 1-5" });
    }

    const comic = await ensureComicExists(comicType, comicId);
    if (!comic) {
      return res.status(404).json({ message: "Không tìm thấy truyện" });
    }

    await db.query(
      `
      INSERT INTO comic_ratings (comic_type, comic_id, user_id, rating, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (comic_type, comic_id, user_id)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        updated_at = NOW()
      `,
      [comicType, comicId, userId, rating]
    );

    const summary = await db.query(
      `
      SELECT
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float AS avg,
        COUNT(*)::int AS count
      FROM comic_ratings
      WHERE comic_type = $1 AND comic_id = $2
      `,
      [comicType, comicId]
    );

    return res.json({
      data: {
        comic_type: comicType,
        comic_id: comicId,
        rating,
        summary: summary.rows[0] || { avg: 0, count: 0 },
      },
    });
  } catch (err) {
    console.error("POST /api/comic-ratings/:comicType/:comicId error:", err);
    return res.status(500).json({ message: "Lỗi server khi gửi rating" });
  }
});

module.exports = router;