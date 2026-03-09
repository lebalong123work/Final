const express = require("express");
const router = express.Router();
const db = require("../db");

function normalizeText(v) {
  return String(v || "").trim();
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (Array.isArray(forwarded) && forwarded.length) {
    return String(forwarded[0]).trim();
  }

  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return (
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    ""
  );
}

/**
 * POST /api/traffic/track
 * body:
 * {
 *   path: "/truyen/one-piece",
 *   sessionId: "sess_xxx",
 *   referer: "..."
 * }
 *
 * logic:
 * - mỗi session + path chỉ ghi 1 lần trong 30 phút
 */
router.post("/track", async (req, res) => {
  try {
    const path = normalizeText(req.body.path);
    const sessionId = normalizeText(req.body.sessionId);
    const referer = normalizeText(req.body.referer);

    if (!path) {
      return res.status(400).json({ message: "path is required" });
    }

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const visitKey = `${sessionId}::${path}`;
    const ipAddress = normalizeText(getClientIp(req));
    const userAgent = normalizeText(req.headers["user-agent"]);

    // nếu bạn có auth optional thì có thể lấy user_id ở đây
    // hiện tại route public nên để null
    const userId = null;

    const existed = await db.query(
      `
      SELECT id
      FROM site_traffic
      WHERE visit_key = $1
        AND created_at >= NOW() - INTERVAL '30 minutes'
      LIMIT 1
      `,
      [visitKey]
    );

    if (existed.rows.length) {
      return res.json({
        success: true,
        dedup: true,
        message: "Traffic đã được ghi gần đây",
      });
    }

    await db.query(
      `
      INSERT INTO site_traffic (
        path,
        session_id,
        visit_key,
        user_id,
        ip_address,
        user_agent,
        referer,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `,
      [
        path,
        sessionId,
        visitKey,
        userId,
        ipAddress || null,
        userAgent || null,
        referer || null,
      ]
    );

    return res.json({
      success: true,
      message: "Đã ghi traffic",
    });
  } catch (err) {
    console.error("POST /api/traffic/track error:", err);
    return res.status(500).json({ message: "Lỗi server khi ghi traffic" });
  }
});

/**
 * GET /api/traffic/stats
 * thống kê cơ bản toàn site
 */
router.get("/stats", async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        COUNT(*)::bigint AS total_views,
        COUNT(DISTINCT session_id)::bigint AS total_sessions,
        COUNT(DISTINCT path)::bigint AS total_paths
      FROM site_traffic
      `
    );

    return res.json({
      success: true,
      data: result.rows[0] || {
        total_views: 0,
        total_sessions: 0,
        total_paths: 0,
      },
    });
  } catch (err) {
    console.error("GET /api/traffic/stats error:", err);
    return res.status(500).json({ message: "Lỗi server khi lấy thống kê traffic" });
  }
});

/**
 * GET /api/traffic/dashboard
 * thống kê cho dashboard admin
 */
router.get("/dashboard", async (req, res) => {
  try {
    const [totalResult, todayResult, weekResult, monthResult, topPagesResult, dailyResult] =
      await Promise.all([
        db.query(`
          SELECT COUNT(*)::bigint AS total_views
          FROM site_traffic
        `),

        db.query(`
          SELECT COUNT(*)::bigint AS today_views
          FROM site_traffic
          WHERE created_at::date = CURRENT_DATE
        `),

        db.query(`
          SELECT COUNT(*)::bigint AS week_views
          FROM site_traffic
          WHERE created_at >= NOW() - INTERVAL '7 days'
        `),

        db.query(`
          SELECT COUNT(*)::bigint AS month_views
          FROM site_traffic
          WHERE created_at >= NOW() - INTERVAL '30 days'
        `),

        db.query(`
          SELECT
            path,
            COUNT(*)::bigint AS views
          FROM site_traffic
          GROUP BY path
          ORDER BY views DESC, path ASC
          LIMIT 10
        `),

        db.query(`
          SELECT
            TO_CHAR(DATE(created_at), 'YYYY-MM-DD') AS day,
            COUNT(*)::bigint AS views
          FROM site_traffic
          WHERE created_at >= NOW() - INTERVAL '7 days'
          GROUP BY DATE(created_at)
          ORDER BY day ASC
        `),
      ]);

    return res.json({
      success: true,
      data: {
        total_views: Number(totalResult.rows[0]?.total_views || 0),
        today_views: Number(todayResult.rows[0]?.today_views || 0),
        week_views: Number(weekResult.rows[0]?.week_views || 0),
        month_views: Number(monthResult.rows[0]?.month_views || 0),
        top_pages: (topPagesResult.rows || []).map((x) => ({
          path: x.path,
          views: Number(x.views || 0),
        })),
        daily_views: (dailyResult.rows || []).map((x) => ({
          day: x.day,
          views: Number(x.views || 0),
        })),
      },
    });
  } catch (err) {
    console.error("GET /api/traffic/dashboard error:", err);
    return res.status(500).json({ message: "Lỗi server khi lấy dashboard traffic" });
  }
});

/**
 * GET /api/traffic/page?path=/truyen/abc
 * lấy lượt xem của 1 path cụ thể
 */
router.get("/page", async (req, res) => {
  try {
    const path = normalizeText(req.query.path);

    if (!path) {
      return res.status(400).json({ message: "path is required" });
    }

    const result = await db.query(
      `
      SELECT COUNT(*)::bigint AS views
      FROM site_traffic
      WHERE path = $1
      `,
      [path]
    );

    return res.json({
      success: true,
      data: {
        path,
        views: Number(result.rows[0]?.views || 0),
      },
    });
  } catch (err) {
    console.error("GET /api/traffic/page error:", err);
    return res.status(500).json({ message: "Lỗi server khi lấy lượt xem trang" });
  }
});

module.exports = router;