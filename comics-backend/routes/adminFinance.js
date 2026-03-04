const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth, requireAdmin } = require("../middleware/auth");


router.get("/finance/overview", auth, requireAdmin, async (req, res) => {
  try {
    // Tổng nạp (success)
  const topupSum = await db.query(
  `SELECT COALESCE(SUM(amount),0)::bigint AS total
   FROM wallet_transactions
   WHERE type LIKE 'topup%' AND status='success'`
);

    // Tổng chi (mua truyện) (success) - nếu bạn đang lưu amount âm thì lấy ABS
    const spendSum = await db.query(
      `SELECT COALESCE(SUM(ABS(amount)),0)::bigint AS total
       FROM wallet_transactions
       WHERE type IN ('purchase','buy_comic') AND status='success'`
    );

    // Hôm nay
    const todayCnt = await db.query(
      `SELECT COUNT(*)::int AS total
       FROM wallet_transactions
       WHERE created_at::date = CURRENT_DATE`
    );

    // Tháng này
    const monthCnt = await db.query(
      `SELECT COUNT(*)::int AS total
       FROM wallet_transactions
       WHERE date_trunc('month', created_at) = date_trunc('month', NOW())`
    );

    return res.json({
      success: true,
      data: {
        totalTopup: Number(topupSum.rows[0]?.total || 0),
        totalSpend: Number(spendSum.rows[0]?.total || 0),
        todayTransactions: todayCnt.rows[0]?.total || 0,
        monthTransactions: monthCnt.rows[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error("GET finance overview error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


router.get("/finance/topups", auth, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
    const offset = (page - 1) * limit;

    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim(); 
    const from = String(req.query.from || "").trim();     
    const to = String(req.query.to || "").trim();        

    const params = [];
    const where = [];

where.push(`(wt.type LIKE 'topup%' OR wt.type='topup')`);

    if (status) {
      params.push(status);
      where.push(`wt.status = $${params.length}`);
    }

    if (from) {
      params.push(from);
      where.push(`wt.created_at::date >= $${params.length}::date`);
    }

    if (to) {
      params.push(to);
      where.push(`wt.created_at::date <= $${params.length}::date`);
    }

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      where.push(`
        (
          LOWER(u.username) LIKE $${params.length}
          OR LOWER(u.email) LIKE $${params.length}
          OR LOWER(COALESCE(wt.order_id,'')) LIKE $${params.length}
          OR LOWER(COALESCE(wt.trans_id::text,'')) LIKE $${params.length}
        )
      `);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // total
    const totalRes = await db.query(
      `
      SELECT COUNT(*)::int AS total
      FROM wallet_transactions wt
      LEFT JOIN users u ON u.id = wt.user_id
      ${whereSql}
      `,
      params
    );
    const total = totalRes.rows[0]?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // data
    params.push(limit);
    params.push(offset);

    const result = await db.query(
      `
      SELECT wt.id, wt.user_id, u.username, u.email,
             wt.type, wt.amount, wt.note, wt.order_id, wt.trans_id, wt.status, wt.created_at
      FROM wallet_transactions wt
      LEFT JOIN users u ON u.id = wt.user_id
      ${whereSql}
      ORDER BY wt.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params
    );

    return res.json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      data: result.rows,
    });
  } catch (err) {
    console.error("Admin get topups error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


router.get("/wallet/transactions", auth, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 5)));
    const offset = (page - 1) * limit;

    const totalRes = await db.query(`SELECT COUNT(*)::int AS total FROM wallet_transactions`);
    const total = totalRes.rows[0]?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const result = await db.query(
      `SELECT wt.id, wt.user_id, u.username, u.email,
              wt.type, wt.amount, wt.note, wt.order_id, wt.trans_id, wt.status, wt.created_at
       FROM wallet_transactions wt
       LEFT JOIN users u ON u.id = wt.user_id
       ORDER BY wt.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return res.json({ success: true, page, limit, total, totalPages, data: result.rows });
  } catch (err) {
    console.error("Admin get transactions error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;