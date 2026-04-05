const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const { auth } = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

function normalizeText(v) {
  return String(v || "").trim();
}

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isValidComicType(type) {
  return type === "external" || type === "self";
}

function getUserIdFromToken(req) {
  try {
    const raw = req.headers.authorization || "";
    const token = raw.replace("Bearer ", "").trim();
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET);
    return Number(decoded?.id || 0) || null;
  } catch {
    return null;
  }
}

async function ensureComicExists(client, comicType, comicId) {
  if (comicType === "external") {
    const check = await client.query(
      `
      SELECT id, slug, name
      FROM external_comics
      WHERE id = $1
      LIMIT 1
      `,
      [comicId]
    );

    if (!check.rows.length) return null;
    return check.rows[0];
  }

  const check = await client.query(
    `
    SELECT id, title
    FROM self_comics
    WHERE id = $1
    LIMIT 1
    `,
    [comicId]
  );

  if (!check.rows.length) return null;
  return check.rows[0];
}

/**
 * GET /api/reactions/chapter/:chapterId
 * Đếm tim theo từng chapter + check user hiện tại đã tim chapter đó chưa
 *
 * query optional:
 * - comicId
 * - comicType
 *
 * Nếu có comicId + comicType => đếm chính xác theo chapter thuộc truyện đó
 * Nếu không có => fallback theo chapter_id
 */
router.get("/chapter/:chapterId", async (req, res) => {
  try {
    const chapterId = normalizeText(req.params.chapterId);
    const comicId = toInt(req.query.comicId, 0);
    const comicType = normalizeText(req.query.comicType);
    const userId = getUserIdFromToken(req);

    if (!chapterId) {
      return res.status(400).json({ message: "chapterId is required" });
    }

    let countRes;
    let likedRes = { rows: [] };

    if (comicId > 0 && isValidComicType(comicType)) {
      countRes = await db.query(
        `
        SELECT COUNT(*)::int AS cnt
        FROM chapter_reactions
        WHERE chapter_id = $1
          AND comic_id = $2
          AND comic_type = $3
        `,
        [chapterId, comicId, comicType]
      );

      if (userId) {
        likedRes = await db.query(
          `
          SELECT 1
          FROM chapter_reactions
          WHERE chapter_id = $1
            AND comic_id = $2
            AND comic_type = $3
            AND user_id = $4
          LIMIT 1
          `,
          [chapterId, comicId, comicType, userId]
        );
      }
    } else {
      countRes = await db.query(
        `
        SELECT COUNT(*)::int AS cnt
        FROM chapter_reactions
        WHERE chapter_id = $1
        `,
        [chapterId]
      );

      if (userId) {
        likedRes = await db.query(
          `
          SELECT 1
          FROM chapter_reactions
          WHERE chapter_id = $1
            AND user_id = $2
          LIMIT 1
          `,
          [chapterId, userId]
        );
      }
    }

    return res.json({
      success: true,
      data: {
        likeCount: Number(countRes.rows[0]?.cnt || 0),
        liked: likedRes.rows.length > 0,
      },
    });
  } catch (e) {
    console.error("GET /api/reactions/chapter/:chapterId error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/reactions/chapter/:chapterId/toggle
 * body:
 * {
 *   comicId: number,
 *   comicType: "external" | "self",
 *   slug?: string,
 *   chapApi?: string,
 *   chapterTitle?: string
 * }
 */
router.post("/chapter/:chapterId/toggle", auth, async (req, res) => {
  const client = await db.connect();

  try {
    const userId = Number(req.user.id || 0);
    const chapterId = normalizeText(req.params.chapterId);
    const comicId = toInt(req.body.comicId, 0);
    const comicType = normalizeText(req.body.comicType);
    const slug = normalizeText(req.body.slug);
    const chapApi = normalizeText(req.body.chapApi);
    const chapterTitle = normalizeText(req.body.chapterTitle);

    if (!chapterId) {
      return res.status(400).json({ message: "chapterId is required" });
    }

    if (!comicId) {
      return res.status(400).json({ message: "comicId không hợp lệ" });
    }

    if (!isValidComicType(comicType)) {
      return res.status(400).json({ message: "comicType phải là external hoặc self" });
    }

    await client.query("BEGIN");

    const comic = await ensureComicExists(client, comicType, comicId);
    if (!comic) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message:
          comicType === "external"
            ? "Không tìm thấy truyện external"
            : "Không tìm thấy truyện self",
      });
    }

    const existed = await client.query(
      `
      SELECT id
      FROM chapter_reactions
      WHERE user_id = $1
        AND comic_type = $2
        AND comic_id = $3
        AND chapter_id = $4
      LIMIT 1
      `,
      [userId, comicType, comicId, chapterId]
    );

    let liked = false;

    if (existed.rows.length) {
      await client.query(
        `
        DELETE FROM chapter_reactions
        WHERE user_id = $1
          AND comic_type = $2
          AND comic_id = $3
          AND chapter_id = $4
        `,
        [userId, comicType, comicId, chapterId]
      );
      liked = false;
    } else {
      await client.query(
        `
        INSERT INTO chapter_reactions (
          chapter_id,
          user_id,
          comic_id,
          comic_type,
          slug,
          chap_api,
          chapter_title,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `,
        [
          chapterId,
          userId,
          comicId,
          comicType,
          slug || null,
          chapApi || null,
          chapterTitle || null,
        ]
      );
      liked = true;
    }

    const countRes = await client.query(
      `
      SELECT COUNT(*)::int AS cnt
      FROM chapter_reactions
      WHERE comic_type = $1
        AND comic_id = $2
        AND chapter_id = $3
      `,
      [comicType, comicId, chapterId]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      data: {
        liked,
        likeCount: Number(countRes.rows[0]?.cnt || 0),
        comicId,
        comicType,
        chapterId,
        chapterTitle: chapterTitle || null,
      },
    });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("POST /api/reactions/chapter/:chapterId/toggle error:", e);

    if (e.code === "23505") {
      return res.status(409).json({ message: "Chapter này đã được yêu thích" });
    }

    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

/**
 * GET /api/reactions/comic/:comicType/:comicId
 * lấy tổng user yêu thích 1 truyện + user hiện tại đã thích truyện này chưa
 *
 * liked = true nếu user đã tim ít nhất 1 chapter của truyện đó
 * likeCount = số user distinct đã tim truyện đó
 */
router.get("/comic/:comicType/:comicId", async (req, res) => {
  try {
    const comicType = normalizeText(req.params.comicType);
    const comicId = toInt(req.params.comicId, 0);
    const userId = getUserIdFromToken(req);

    if (!isValidComicType(comicType)) {
      return res.status(400).json({ message: "comicType phải là external hoặc self" });
    }

    if (!comicId) {
      return res.status(400).json({ message: "comicId không hợp lệ" });
    }

    const countRes = await db.query(
      `
      SELECT COUNT(DISTINCT user_id)::int AS cnt
      FROM chapter_reactions
      WHERE comic_type = $1
        AND comic_id = $2
      `,
      [comicType, comicId]
    );

    let liked = false;

    if (userId) {
      const likedRes = await db.query(
        `
        SELECT 1
        FROM chapter_reactions
        WHERE user_id = $1
          AND comic_type = $2
          AND comic_id = $3
        LIMIT 1
        `,
        [userId, comicType, comicId]
      );

      liked = likedRes.rows.length > 0;
    }

    return res.json({
      success: true,
      data: {
        liked,
        likeCount: Number(countRes.rows[0]?.cnt || 0),
      },
    });
  } catch (e) {
    console.error("GET /api/reactions/comic/:comicType/:comicId error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/reactions/my-liked/:comicType/:comicId
 * check riêng user hiện tại có thích truyện này chưa
 * = đã tim ít nhất 1 chapter trong truyện đó
 */
router.get("/my-liked/:comicType/:comicId", auth, async (req, res) => {
  try {
    const userId = Number(req.user.id || 0);
    const comicType = normalizeText(req.params.comicType);
    const comicId = toInt(req.params.comicId, 0);

    if (!isValidComicType(comicType)) {
      return res.status(400).json({ message: "comicType phải là external hoặc self" });
    }

    if (!comicId) {
      return res.status(400).json({ message: "comicId không hợp lệ" });
    }

    const likedRes = await db.query(
      `
      SELECT 1
      FROM chapter_reactions
      WHERE user_id = $1
        AND comic_type = $2
        AND comic_id = $3
      LIMIT 1
      `,
      [userId, comicType, comicId]
    );

    return res.json({
      success: true,
      data: {
        liked: likedRes.rows.length > 0,
      },
    });
  } catch (e) {
    console.error("GET /api/reactions/my-liked/:comicType/:comicId error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/reactions/library
 * tủ truyện yêu thích của user hiện tại
 *
 * Mỗi truyện chỉ hiện 1 dòng, lấy chapter user thích gần nhất làm last_chapter_*
 */
router.get("/library", auth, async (req, res) => {
  try {
    const userId = Number(req.user.id || 0);

    const selfRes = await db.query(
      `
      SELECT DISTINCT ON (cr.comic_id)
        'self' AS comic_type,
        sc.id,
        sc.title,
        sc.cover_image,
        sc.status,
        sc.updated_at,
        sc.created_at,
        NULL::text AS slug,
        cr.chapter_id AS last_chapter_id,
        cr.chapter_title AS last_chapter_title,
        cr.chap_api AS last_chapter_api,
        cr.created_at AS favorited_at
      FROM chapter_reactions cr
      JOIN self_comics sc
        ON sc.id = cr.comic_id
      WHERE cr.user_id = $1
        AND cr.comic_type = 'self'
      ORDER BY cr.comic_id, cr.created_at DESC
      `,
      [userId]
    );

    const externalRes = await db.query(
      `
      SELECT DISTINCT ON (cr.comic_id)
        'external' AS comic_type,
        ec.id,
        ec.name AS title,
        ec.thumb_url AS cover_image,
        ec.status,
        ec.updated_at,
        ec.created_at,
        COALESCE(cr.slug, ec.slug) AS slug,
        cr.chapter_id AS last_chapter_id,
        cr.chapter_title AS last_chapter_title,
        cr.chap_api AS last_chapter_api,
        cr.created_at AS favorited_at
      FROM chapter_reactions cr
      JOIN external_comics ec
        ON ec.id = cr.comic_id
      WHERE cr.user_id = $1
        AND cr.comic_type = 'external'
      ORDER BY cr.comic_id, cr.created_at DESC
      `,
      [userId]
    );

    const rows = [...(selfRes.rows || []), ...(externalRes.rows || [])].sort((a, b) => {
      const at = new Date(a.favorited_at || 0).getTime();
      const bt = new Date(b.favorited_at || 0).getTime();
      return bt - at;
    });

    return res.json({
      success: true,
      data: rows,
    });
  } catch (e) {
    console.error("GET /api/reactions/library error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/reactions/top-comics?limit=10
 * top truyện được yêu thích nhiều nhất
 *
 * tính theo số user distinct thích truyện
 */
router.get("/top-comics", async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(20, Number(req.query.limit || 10)));

    const selfRes = await db.query(
      `
      SELECT
        'self' AS comic_type,
        sc.id,
        sc.title,
        sc.cover_image,
        sc.status,
        NULL::text AS slug,
        COUNT(DISTINCT cr.user_id)::int AS like_count
      FROM chapter_reactions cr
      JOIN self_comics sc
        ON sc.id = cr.comic_id
      WHERE cr.comic_type = 'self'
      GROUP BY sc.id, sc.title, sc.cover_image, sc.status
      `
    );

    const externalRes = await db.query(
      `
      SELECT
        'external' AS comic_type,
        ec.id,
        ec.name AS title,
        ec.thumb_url AS cover_image,
        ec.status,
        ec.slug,
        COUNT(DISTINCT cr.user_id)::int AS like_count
      FROM chapter_reactions cr
      JOIN external_comics ec
        ON ec.id = cr.comic_id
      WHERE cr.comic_type = 'external'
      GROUP BY ec.id, ec.name, ec.thumb_url, ec.status, ec.slug
      `
    );

    const merged = [...(selfRes.rows || []), ...(externalRes.rows || [])]
      .sort((a, b) => Number(b.like_count || 0) - Number(a.like_count || 0))
      .slice(0, limit);

    return res.json({
      success: true,
      data: merged,
    });
  } catch (e) {
    console.error("GET /api/reactions/top-comics error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/reactions/latest-liked?limit=12
 * truyện mới được thích gần đây
 *
 * mỗi user có thể thích nhiều chapter, nhưng mỗi truyện chỉ lấy mốc thích gần nhất
 */
router.get("/latest-liked", async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(30, Number(req.query.limit || 12)));

    const selfRes = await db.query(
      `
      SELECT DISTINCT ON (cr.comic_id)
        'self' AS comic_type,
        sc.id,
        sc.title,
        sc.cover_image,
        sc.status,
        NULL::text AS slug,
        cr.created_at AS liked_at
      FROM chapter_reactions cr
      JOIN self_comics sc
        ON sc.id = cr.comic_id
      WHERE cr.comic_type = 'self'
      ORDER BY cr.comic_id, cr.created_at DESC
      `
    );

    const externalRes = await db.query(
      `
      SELECT DISTINCT ON (cr.comic_id)
        'external' AS comic_type,
        ec.id,
        ec.name AS title,
        ec.thumb_url AS cover_image,
        ec.status,
        ec.slug,
        cr.created_at AS liked_at
      FROM chapter_reactions cr
      JOIN external_comics ec
        ON ec.id = cr.comic_id
      WHERE cr.comic_type = 'external'
      ORDER BY cr.comic_id, cr.created_at DESC
      `
    );

    const rows = [...(selfRes.rows || []), ...(externalRes.rows || [])]
      .sort((a, b) => new Date(b.liked_at || 0).getTime() - new Date(a.liked_at || 0).getTime())
      .slice(0, limit);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (e) {
    console.error("GET /api/reactions/latest-liked error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;