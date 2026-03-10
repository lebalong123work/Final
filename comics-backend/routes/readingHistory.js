const express = require("express");
const db = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeText(v) {
  return String(v || "").trim();
}

function isValidComicType(type) {
  return type === "external" || type === "self";
}

/**
 * POST /api/reading-history/mark
 * body:
 * {
 *   comicType: "external" | "self",
 *   comicId: number,
 *   chapterId: string | number,
 *   chapterApi?: string,      // cho external
 *   chapterTitle?: string     // cho external
 * }
 */
router.post("/mark", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const comicType = normalizeText(req.body.comicType);
    const comicId = toInt(req.body.comicId, 0);
    const rawChapterId = req.body.chapterId;

    if (!isValidComicType(comicType)) {
      return res.status(400).json({ message: "comicType phải là external hoặc self" });
    }

    if (!comicId) {
      return res.status(400).json({ message: "comicId không hợp lệ" });
    }

    if (rawChapterId === undefined || rawChapterId === null || rawChapterId === "") {
      return res.status(400).json({ message: "chapterId không hợp lệ" });
    }

    if (comicType === "self") {
      const selfChapterId = toInt(rawChapterId, 0);

      if (!selfChapterId) {
        return res.status(400).json({ message: "self chapterId không hợp lệ" });
      }

      const comicCheck = await db.query(
        `
        SELECT id
        FROM self_comics
        WHERE id = $1
        LIMIT 1
        `,
        [comicId]
      );

      if (!comicCheck.rows.length) {
        return res.status(404).json({ message: "Không tìm thấy truyện self" });
      }

      const chapterCheck = await db.query(
        `
        SELECT id, comic_id
        FROM self_comic_chapters
        WHERE id = $1 AND comic_id = $2
        LIMIT 1
        `,
        [selfChapterId, comicId]
      );

      if (!chapterCheck.rows.length) {
        return res.status(404).json({ message: "Không tìm thấy chapter self thuộc truyện này" });
      }

      await db.query(
        `
        INSERT INTO user_chapter_reads (
          user_id,
          comic_type,
          self_chapter_id,
          self_comic_id,
          read_at
        )
        VALUES ($1, 'self', $2, $3, NOW())
        ON CONFLICT DO NOTHING
        `,
        [userId, selfChapterId, comicId]
      );

      await db.query(
        `
        UPDATE user_chapter_reads
        SET read_at = NOW()
        WHERE user_id = $1
          AND comic_type = 'self'
          AND self_chapter_id = $2
        `,
        [userId, selfChapterId]
      );

      return res.json({
        success: true,
        message: "Đã lưu lịch sử đọc self",
        data: {
          comicType: "self",
          comicId,
          chapterId: selfChapterId,
        },
      });
    }

    // external
    const externalChapterId = normalizeText(rawChapterId);
    const externalChapterApi = normalizeText(req.body.chapterApi);
    const externalChapterTitle = normalizeText(req.body.chapterTitle);

    if (!externalChapterId) {
      return res.status(400).json({ message: "external chapterId không hợp lệ" });
    }

    const comicCheck = await db.query(
      `
      SELECT id
      FROM external_comics
      WHERE id = $1
      LIMIT 1
      `,
      [comicId]
    );

    if (!comicCheck.rows.length) {
      return res.status(404).json({ message: "Không tìm thấy truyện external" });
    }

    await db.query(
      `
      INSERT INTO user_chapter_reads (
        user_id,
        comic_type,
        external_chapter_id,
        external_chapter_api,
        external_chapter_title,
        external_comic_id,
        read_at
      )
      VALUES ($1, 'external', $2, $3, $4, $5, NOW())
      ON CONFLICT DO NOTHING
      `,
      [
        userId,
        externalChapterId,
        externalChapterApi || null,
        externalChapterTitle || null,
        comicId,
      ]
    );

    await db.query(
      `
      UPDATE user_chapter_reads
      SET
        read_at = NOW(),
        external_chapter_api = COALESCE($3, external_chapter_api),
        external_chapter_title = COALESCE($4, external_chapter_title)
      WHERE user_id = $1
        AND comic_type = 'external'
        AND external_chapter_id = $2
      `,
      [
        userId,
        externalChapterId,
        externalChapterApi || null,
        externalChapterTitle || null,
      ]
    );

    return res.json({
      success: true,
      message: "Đã lưu lịch sử đọc external",
      data: {
        comicType: "external",
        comicId,
        chapterId: externalChapterId,
        chapterApi: externalChapterApi || null,
        chapterTitle: externalChapterTitle || null,
      },
    });
  } catch (err) {
    console.error("POST /api/reading-history/mark error:", err);
    return res.status(500).json({ message: "Lỗi server khi lưu lịch sử đọc" });
  }
});

/**
 * GET /api/reading-history/comic/:comicType/:comicId
 * lấy danh sách chapter đã đọc trong 1 truyện
 */
router.get("/comic/:comicType/:comicId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const comicType = normalizeText(req.params.comicType);
    const comicId = toInt(req.params.comicId, 0);

    if (!isValidComicType(comicType)) {
      return res.status(400).json({ message: "comicType phải là external hoặc self" });
    }

    if (!comicId) {
      return res.status(400).json({ message: "comicId không hợp lệ" });
    }

    let sql = "";
    let params = [];

    if (comicType === "self") {
      sql = `
        SELECT
          self_chapter_id AS chapter_id,
          NULL::text AS chapter_api,
          NULL::text AS chapter_title,
          read_at
        FROM user_chapter_reads
        WHERE user_id = $1
          AND comic_type = 'self'
          AND self_comic_id = $2
        ORDER BY read_at DESC
      `;
      params = [userId, comicId];
    } else {
      sql = `
        SELECT
          external_chapter_id AS chapter_id,
          external_chapter_api AS chapter_api,
          external_chapter_title AS chapter_title,
          read_at
        FROM user_chapter_reads
        WHERE user_id = $1
          AND comic_type = 'external'
          AND external_comic_id = $2
        ORDER BY read_at DESC
      `;
      params = [userId, comicId];
    }

    const result = await db.query(sql, params);

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error("GET /api/reading-history/comic/:comicType/:comicId error:", err);
    return res.status(500).json({ message: "Lỗi server khi lấy chapter đã đọc" });
  }
});

/**
 * GET /api/reading-history/stats
 * thống kê đọc cho user
 */
router.get("/stats", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `
      SELECT
        COUNT(*)::int AS total_chapters_read,
        COUNT(DISTINCT CASE WHEN comic_type = 'self' THEN self_comic_id END)::int AS total_self_comics_read,
        COUNT(DISTINCT CASE WHEN comic_type = 'external' THEN external_comic_id END)::int AS total_external_comics_read,
        COUNT(DISTINCT
          CASE
            WHEN comic_type = 'self' THEN CONCAT('self:', self_comic_id)
            WHEN comic_type = 'external' THEN CONCAT('external:', external_comic_id)
          END
        )::int AS total_comics_read
      FROM user_chapter_reads
      WHERE user_id = $1
      `,
      [userId]
    );

    return res.json({
      success: true,
      data: result.rows[0] || {
        total_chapters_read: 0,
        total_self_comics_read: 0,
        total_external_comics_read: 0,
        total_comics_read: 0,
      },
    });
  } catch (err) {
    console.error("GET /api/reading-history/stats error:", err);
    return res.status(500).json({ message: "Lỗi server khi lấy thống kê" });
  }
});

/**
 * GET /api/reading-history/library
 * tủ truyện gồm cả self + external
 */
router.get("/library", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // SELF LIBRARY
    const selfResult = await db.query(
      `
      WITH latest_reads AS (
        SELECT
          self_comic_id,
          MAX(read_at) AS last_read_at
        FROM user_chapter_reads
        WHERE user_id = $1
          AND comic_type = 'self'
          AND self_comic_id IS NOT NULL
        GROUP BY self_comic_id
      ),
      last_chapter AS (
        SELECT DISTINCT ON (self_comic_id)
          self_comic_id,
          self_chapter_id,
          read_at
        FROM user_chapter_reads
        WHERE user_id = $1
          AND comic_type = 'self'
        ORDER BY self_comic_id, read_at DESC
      ),
      read_stats AS (
        SELECT
          self_comic_id,
          COUNT(*)::int AS read_count
        FROM user_chapter_reads
        WHERE user_id = $1
          AND comic_type = 'self'
        GROUP BY self_comic_id
      )
      SELECT
        'self' AS comic_type,
        sc.id,
        sc.title,
        sc.cover_image,
        sc.status,
        sc.total_chapters,
        sc.updated_at,
        sc.created_at,
        lc.self_chapter_id AS last_read_chapter_id,
        NULL::text AS last_read_chapter_api,
        ch.chapter_no AS last_read_chapter_no,
        ch.chapter_title AS last_read_chapter_title,
        lc.read_at AS last_read_at,
        rs.read_count
      FROM latest_reads lr
      JOIN self_comics sc ON sc.id = lr.self_comic_id
      LEFT JOIN last_chapter lc ON lc.self_comic_id = sc.id
      LEFT JOIN self_comic_chapters ch ON ch.id = lc.self_chapter_id
      LEFT JOIN read_stats rs ON rs.self_comic_id = sc.id
      ORDER BY lr.last_read_at DESC
      `,
      [userId]
    );

    // EXTERNAL LIBRARY
    const externalResult = await db.query(
      `
      WITH latest_reads AS (
        SELECT
          external_comic_id,
          MAX(read_at) AS last_read_at
        FROM user_chapter_reads
        WHERE user_id = $1
          AND comic_type = 'external'
          AND external_comic_id IS NOT NULL
        GROUP BY external_comic_id
      ),
      last_chapter AS (
        SELECT DISTINCT ON (external_comic_id)
          external_comic_id,
          external_chapter_id,
          external_chapter_api,
          external_chapter_title,
          read_at
        FROM user_chapter_reads
        WHERE user_id = $1
          AND comic_type = 'external'
        ORDER BY external_comic_id, read_at DESC
      ),
      read_stats AS (
        SELECT
          external_comic_id,
          COUNT(*)::int AS read_count
        FROM user_chapter_reads
        WHERE user_id = $1
          AND comic_type = 'external'
        GROUP BY external_comic_id
      )
      SELECT
        'external' AS comic_type,
        ec.id,
        ec.name AS title,
        ec.thumb_url AS cover_image,
        ec.status,
        NULL::int AS total_chapters,
        ec.updated_at,
        ec.created_at,
        lc.external_chapter_id AS last_read_chapter_id,
        lc.external_chapter_api AS last_read_chapter_api,
        NULL::text AS last_read_chapter_no,
        COALESCE(lc.external_chapter_title, lc.external_chapter_id) AS last_read_chapter_title,
        lc.read_at AS last_read_at,
        rs.read_count,
        ec.slug
      FROM latest_reads lr
      JOIN external_comics ec ON ec.id = lr.external_comic_id
      LEFT JOIN last_chapter lc ON lc.external_comic_id = ec.id
      LEFT JOIN read_stats rs ON rs.external_comic_id = ec.id
      ORDER BY lr.last_read_at DESC
      `,
      [userId]
    );

    const selfRows = (selfResult.rows || []).map((x) => ({
      ...x,
      slug: null,
    }));

    const externalRows = externalResult.rows || [];

    const merged = [...selfRows, ...externalRows].sort((a, b) => {
      const at = new Date(a.last_read_at || 0).getTime();
      const bt = new Date(b.last_read_at || 0).getTime();
      return bt - at;
    });

    return res.json({
      success: true,
      data: merged,
    });
  } catch (err) {
    console.error("GET /api/reading-history/library error:", err);
    return res.status(500).json({ message: "Lỗi server khi lấy tủ truyện" });
  }
});


router.get("/top-comics", async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(20, Number(req.query.limit || 3)));

    // TOP SELF
    const selfResult = await db.query(
      `
      SELECT
        'self' AS comic_type,
        sc.id,
        sc.title,
        sc.cover_image,
        sc.status,
        sc.updated_at,
        sc.created_at,
        sc.id::text AS slug,
        COUNT(*)::int AS read_count
      FROM user_chapter_reads ucr
      JOIN self_comics sc
        ON sc.id = ucr.self_comic_id
      WHERE ucr.comic_type = 'self'
        AND ucr.self_comic_id IS NOT NULL
      GROUP BY
        sc.id,
        sc.title,
        sc.cover_image,
        sc.status,
        sc.updated_at,
        sc.created_at
      `
    );

    // TOP EXTERNAL
    const externalResult = await db.query(
      `
      SELECT
        'external' AS comic_type,
        ec.id,
        ec.name AS title,
        ec.thumb_url AS cover_image,
        ec.status,
        ec.updated_at,
        ec.created_at,
        ec.slug,
        COUNT(*)::int AS read_count
      FROM user_chapter_reads ucr
      JOIN external_comics ec
        ON ec.id = ucr.external_comic_id
      WHERE ucr.comic_type = 'external'
        AND ucr.external_comic_id IS NOT NULL
      GROUP BY
        ec.id,
        ec.name,
        ec.thumb_url,
        ec.status,
        ec.updated_at,
        ec.created_at,
        ec.slug
      `
    );

    const selfRows = selfResult.rows || [];
    const externalRows = externalResult.rows || [];

    const merged = [...selfRows, ...externalRows]
      .sort((a, b) => {
        const readDiff = Number(b.read_count || 0) - Number(a.read_count || 0);
        if (readDiff !== 0) return readDiff;

        const bt = new Date(b.updated_at || b.created_at || 0).getTime();
        const at = new Date(a.updated_at || a.created_at || 0).getTime();
        return bt - at;
      })
      .slice(0, limit)
      .map((item, idx) => ({
        ...item,
        badge: idx === 0 ? "HOT" : idx === 1 ? "TOP" : "NEW",
      }));

    return res.json({
      success: true,
      data: merged,
    });
  } catch (err) {
    console.error("GET /api/reading-history/top-comics error:", err);
    return res.status(500).json({ message: "Lỗi server khi lấy top truyện" });
  }
});
module.exports = router;