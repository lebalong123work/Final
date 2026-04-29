const db = require("../../db");

async function checkDuplicate(visitKey) {
  const r = await db.query(
    `SELECT id FROM site_traffic WHERE visit_key=$1 AND created_at >= NOW() - INTERVAL '30 minutes' LIMIT 1`,
    [visitKey]
  );
  return r.rows.length > 0;
}

async function insertVisit(path, sessionId, visitKey, userId, ipAddress, userAgent, referer) {
  await db.query(
    `INSERT INTO site_traffic (path, session_id, visit_key, user_id, ip_address, user_agent, referer, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
    [path, sessionId, visitKey, userId, ipAddress || null, userAgent || null, referer || null]
  );
}

async function getStats() {
  const r = await db.query(
    `SELECT COUNT(*)::bigint AS total_views,
            COUNT(DISTINCT session_id)::bigint AS total_sessions,
            COUNT(DISTINCT path)::bigint AS total_paths
     FROM site_traffic`
  );
  return r.rows[0] || { total_views: 0, total_sessions: 0, total_paths: 0 };
}

async function getDashboard(interval) {
  const [totalR, todayR, weekR, monthR, topR, dailyR] = await Promise.all([
    db.query(`SELECT COUNT(*)::bigint AS total_views FROM site_traffic`),
    db.query(`SELECT COUNT(*)::bigint AS today_views FROM site_traffic WHERE created_at::date = CURRENT_DATE`),
    db.query(`SELECT COUNT(*)::bigint AS week_views FROM site_traffic WHERE created_at >= NOW() - INTERVAL '7 days'`),
    db.query(`SELECT COUNT(*)::bigint AS month_views FROM site_traffic WHERE created_at >= NOW() - INTERVAL '30 days'`),
    db.query(`SELECT path, COUNT(*)::bigint AS views FROM site_traffic GROUP BY path ORDER BY views DESC, path ASC LIMIT 10`),
    db.query(`SELECT TO_CHAR(DATE(created_at),'YYYY-MM-DD') AS day, COUNT(*)::bigint AS views FROM site_traffic WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY day ASC`),
  ]);
  return {
    total_views: Number(totalR.rows[0]?.total_views || 0),
    today_views: Number(todayR.rows[0]?.today_views || 0),
    week_views: Number(weekR.rows[0]?.week_views || 0),
    month_views: Number(monthR.rows[0]?.month_views || 0),
    top_pages: (topR.rows || []).map((x) => ({ path: x.path, views: Number(x.views || 0) })),
    daily_views: (dailyR.rows || []).map((x) => ({ day: x.day, views: Number(x.views || 0) })),
  };
}

async function getPageViews(path) {
  const r = await db.query(
    `SELECT COUNT(*)::bigint AS views FROM site_traffic WHERE path=$1`,
    [path]
  );
  return Number(r.rows[0]?.views || 0);
}

module.exports = { checkDuplicate, insertVisit, getStats, getDashboard, getPageViews };
