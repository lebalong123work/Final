const db = require("../../db");

async function getOverview() {
  const [topupSum, spendSum, todayCnt, monthCnt] = await Promise.all([
    db.query(`SELECT COALESCE(SUM(amount),0)::bigint AS total FROM wallet_transactions WHERE type LIKE 'topup%' AND status='success'`),
    db.query(`SELECT COALESCE(SUM(ABS(amount)),0)::bigint AS total FROM wallet_transactions WHERE type IN ('purchase','buy_comic') AND status='success'`),
    db.query(`SELECT COUNT(*)::int AS total FROM wallet_transactions WHERE created_at::date=CURRENT_DATE`),
    db.query(`SELECT COUNT(*)::int AS total FROM wallet_transactions WHERE date_trunc('month',created_at)=date_trunc('month',NOW())`),
  ]);
  return {
    totalTopup: Number(topupSum.rows[0]?.total || 0),
    totalSpend: Number(spendSum.rows[0]?.total || 0),
    todayTransactions: todayCnt.rows[0]?.total || 0,
    monthTransactions: monthCnt.rows[0]?.total || 0,
  };
}

async function getTopups(page, limit, q, status, from, to) {
  const offset = (page - 1) * limit;
  const params = [];
  const where = [];
  where.push(`(wt.type LIKE 'topup%' OR wt.type='topup')`);

  if (status) { params.push(status); where.push(`wt.status=$${params.length}`); }
  if (from)   { params.push(from);   where.push(`wt.created_at::date>=$${params.length}::date`); }
  if (to)     { params.push(to);     where.push(`wt.created_at::date<=$${params.length}::date`); }
  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where.push(`(LOWER(u.username) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(COALESCE(wt.order_id,'')) LIKE $${params.length} OR LOWER(COALESCE(wt.trans_id::text,'')) LIKE $${params.length})`);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;
  const totalRes = await db.query(`SELECT COUNT(*)::int AS total FROM wallet_transactions wt LEFT JOIN users u ON u.id=wt.user_id ${whereSql}`, params);
  const total = totalRes.rows[0]?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  params.push(limit); params.push(offset);
  const result = await db.query(
    `SELECT wt.id, wt.user_id, u.username, u.email, wt.type, wt.amount, wt.note, wt.order_id, wt.trans_id, wt.status, wt.created_at
     FROM wallet_transactions wt LEFT JOIN users u ON u.id=wt.user_id ${whereSql}
     ORDER BY wt.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`,
    params
  );
  return { total, totalPages, rows: result.rows };
}

async function getAllTransactions(page, limit) {
  const offset = (page - 1) * limit;
  const totalRes = await db.query(`SELECT COUNT(*)::int AS total FROM wallet_transactions`);
  const total = totalRes.rows[0]?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const result = await db.query(
    `SELECT wt.id, wt.user_id, u.username, u.email, wt.type, wt.amount, wt.note, wt.order_id, wt.trans_id, wt.status, wt.created_at
     FROM wallet_transactions wt LEFT JOIN users u ON u.id=wt.user_id ORDER BY wt.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return { total, totalPages, rows: result.rows };
}

module.exports = { getOverview, getTopups, getAllTransactions };
