const db = require("../../db");

async function getMeProgress(userId) {
  const topupRes = await db.query(
    `SELECT COALESCE(SUM(amount),0)::bigint AS total_topup
     FROM wallet_transactions
     WHERE user_id=$1 AND status='success' AND (type='topup_momo' OR LOWER(note)='topup_momo')`,
    [userId]
  );
  const totalTopup = Number(topupRes.rows[0]?.total_topup || 0);

  const levelsRes = await db.query(
    `SELECT id, level_no, min_total_topup, name FROM levels ORDER BY level_no ASC`
  );
  const levels = levelsRes.rows || [];

  if (!levels.length) {
    return { total_topup: totalTopup, current_level: null, next_level: null, progress_percent: 0, progress_current: totalTopup, progress_needed: 0 };
  }

  let currentLevel = levels[0];
  for (const lv of levels) {
    if (totalTopup >= Number(lv.min_total_topup || 0)) currentLevel = lv;
    else break;
  }

  const currentIndex = levels.findIndex((lv) => Number(lv.id) === Number(currentLevel.id));
  const nextLevel = currentIndex >= 0 && currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

  let progressPercent = 100, progressCurrent = totalTopup, progressNeeded = totalTopup;
  if (nextLevel) {
    const currentMin = Number(currentLevel.min_total_topup || 0);
    const nextMin = Number(nextLevel.min_total_topup || 0);
    const range = Math.max(1, nextMin - currentMin);
    const passed = Math.max(0, totalTopup - currentMin);
    progressPercent = Math.max(0, Math.min(100, Math.round((passed / range) * 100)));
    progressCurrent = totalTopup;
    progressNeeded = nextMin;
  }

  return {
    total_topup: totalTopup,
    current_level: { id: currentLevel.id, level_no: Number(currentLevel.level_no || 0), min_total_topup: Number(currentLevel.min_total_topup || 0), name: currentLevel.name },
    next_level: nextLevel ? { id: nextLevel.id, level_no: Number(nextLevel.level_no || 0), min_total_topup: Number(nextLevel.min_total_topup || 0), name: nextLevel.name } : null,
    progress_percent: progressPercent,
    progress_current: progressCurrent,
    progress_needed: progressNeeded,
  };
}

async function list(keyword, page, limit) {
  const offset = (page - 1) * limit;
  const kw = `%${String(keyword || "").trim()}%`;
  const totalRs = await db.query(
    `SELECT COUNT(*)::int AS total FROM levels WHERE name ILIKE $1 OR level_no::text ILIKE $1`,
    [kw]
  );
  const rs = await db.query(
    `SELECT id, level_no, min_total_topup, name, created_at FROM levels WHERE name ILIKE $1 OR level_no::text ILIKE $1 ORDER BY level_no ASC LIMIT $2 OFFSET $3`,
    [kw, limit, offset]
  );
  return { rows: rs.rows, total: totalRs.rows[0].total };
}

async function getById(id) {
  const r = await db.query(
    `SELECT id, level_no, min_total_topup, name, created_at FROM levels WHERE id=$1`,
    [id]
  );
  return r.rows[0] || null;
}

async function create(levelNo, minTotalTopup, name) {
  const r = await db.query(
    `INSERT INTO levels (level_no, min_total_topup, name) VALUES ($1,$2,$3) RETURNING id, level_no, min_total_topup, name, created_at`,
    [Number(levelNo), minTotalTopup.toString(), String(name).trim()]
  );
  return r.rows[0];
}

async function update(id, levelNo, minTotalTopup, name) {
  const r = await db.query(
    `UPDATE levels SET level_no=$1, min_total_topup=$2, name=$3 WHERE id=$4 RETURNING id, level_no, min_total_topup, name, created_at`,
    [levelNo, minTotalTopup.toString(), name, id]
  );
  return r.rows[0] || null;
}

async function remove(id) {
  const r = await db.query(`DELETE FROM levels WHERE id=$1 RETURNING id`, [id]);
  return r.rows[0] || null;
}

module.exports = { getMeProgress, list, getById, create, update, remove };
