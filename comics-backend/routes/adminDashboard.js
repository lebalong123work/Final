const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth, requireAdmin } = require("../middleware/auth");

function normalizeRange(range) {
  const v = String(range || "").trim().toLowerCase();
  if (v === "today") return "today";
  if (v === "30d") return "30d";
  return "7d";
}

function intervalSql(range) {
  if (range === "today") return "INTERVAL '1 day'";
  if (range === "30d") return "INTERVAL '30 days'";
  return "INTERVAL '7 days'";
}

router.get("/dashboard", auth, requireAdmin, async (req, res) => {
  try {
    const range = normalizeRange(req.query.range);
    const interval = intervalSql(range);

    const [
      trafficSummaryRes,
      trafficDailyRes,
      revenueSummaryRes,
      revenueDailyRes,
      newUsersRes,
      ordersRes,
      latestUsersRes,
    ] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*)::bigint AS total_views,
          COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)::bigint AS today_views,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::bigint AS week_views,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::bigint AS month_views
        FROM site_traffic
      `),

      db.query(`
        SELECT
          TO_CHAR(DATE(created_at), 'YYYY-MM-DD') AS day,
          COUNT(*)::bigint AS views
        FROM site_traffic
        WHERE created_at >= NOW() - ${interval}
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `),

      db.query(`
        SELECT
          COALESCE(SUM(ABS(amount)), 0)::bigint AS total_revenue,
          COALESCE(SUM(ABS(amount)) FILTER (
            WHERE created_at::date = CURRENT_DATE
          ), 0)::bigint AS today_revenue,
          COALESCE(SUM(ABS(amount)) FILTER (
            WHERE created_at >= NOW() - INTERVAL '7 days'
          ), 0)::bigint AS week_revenue,
          COALESCE(SUM(ABS(amount)) FILTER (
            WHERE created_at >= NOW() - INTERVAL '30 days'
          ), 0)::bigint AS month_revenue
        FROM wallet_transactions
        WHERE type = 'purchase'
          AND status = 'success'
      `),

      db.query(`
        SELECT
          TO_CHAR(DATE(created_at), 'YYYY-MM-DD') AS day,
          COALESCE(SUM(ABS(amount)), 0)::bigint AS revenue
        FROM wallet_transactions
        WHERE type = 'purchase'
          AND status = 'success'
          AND created_at >= NOW() - ${interval}
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `),

      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)::bigint AS today_new_users,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::bigint AS week_new_users,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::bigint AS month_new_users
        FROM users
      `),

      db.query(`
        SELECT
          COUNT(*) FILTER (
            WHERE created_at::date = CURRENT_DATE
              AND type = 'purchase'
              AND status = 'success'
          )::bigint AS today_orders,
          COUNT(*) FILTER (
            WHERE created_at >= NOW() - INTERVAL '7 days'
              AND type = 'purchase'
              AND status = 'success'
          )::bigint AS week_orders,
          COUNT(*) FILTER (
            WHERE created_at >= NOW() - INTERVAL '30 days'
              AND type = 'purchase'
              AND status = 'success'
          )::bigint AS month_orders
        FROM wallet_transactions
      `),

      db.query(`
        SELECT
          username AS name,
          email,
          created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 8
      `),
    ]);

    const trafficSummary = trafficSummaryRes.rows[0] || {};
    const revenueSummary = revenueSummaryRes.rows[0] || {};
    const newUsersSummary = newUsersRes.rows[0] || {};
    const ordersSummary = ordersRes.rows[0] || {};

    return res.json({
      success: true,
      range,
      data: {
        traffic: {
          total_views: Number(trafficSummary.total_views || 0),
          today_views: Number(trafficSummary.today_views || 0),
          week_views: Number(trafficSummary.week_views || 0),
          month_views: Number(trafficSummary.month_views || 0),
          daily_views: (trafficDailyRes.rows || []).map((x) => ({
            day: x.day,
            views: Number(x.views || 0),
          })),
        },

        revenue: {
          total_revenue: Number(revenueSummary.total_revenue || 0),
          today_revenue: Number(revenueSummary.today_revenue || 0),
          week_revenue: Number(revenueSummary.week_revenue || 0),
          month_revenue: Number(revenueSummary.month_revenue || 0),
          daily_revenue: (revenueDailyRes.rows || []).map((x) => ({
            day: x.day,
            revenue: Number(x.revenue || 0),
          })),
        },

        users: {
          today_new_users: Number(newUsersSummary.today_new_users || 0),
          week_new_users: Number(newUsersSummary.week_new_users || 0),
          month_new_users: Number(newUsersSummary.month_new_users || 0),
          latest_users: (latestUsersRes.rows || []).map((x) => ({
            name: x.name,
            email: x.email,
            created_at: x.created_at,
          })),
        },

        orders: {
          today_orders: Number(ordersSummary.today_orders || 0),
          week_orders: Number(ordersSummary.week_orders || 0),
          month_orders: Number(ordersSummary.month_orders || 0),
        },

        top_comics: [],
      },
    });
  } catch (err) {
    console.error("GET /api/admin/dashboard error:", err);
    return res.status(500).json({ message: "Lỗi server khi lấy dashboard" });
  }
});

module.exports = router;