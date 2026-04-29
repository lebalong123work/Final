const db = require("../../db");

async function ensureComicExists(comicType, comicId) {
  if (comicType === "external") {
    const r = await db.query(`SELECT id, slug, name FROM external_comics WHERE id=$1 LIMIT 1`, [comicId]);
    return r.rows[0] || null;
  }
  const r = await db.query(`SELECT id, title FROM self_comics WHERE id=$1 LIMIT 1`, [comicId]);
  return r.rows[0] || null;
}

async function getSummary(comicType, comicId) {
  const r = await db.query(
    `SELECT COALESCE(ROUND(AVG(rating)::numeric,1),0)::float AS avg, COUNT(*)::int AS count
     FROM comic_ratings WHERE comic_type=$1 AND comic_id=$2`,
    [comicType, comicId]
  );
  return r.rows[0] || { avg: 0, count: 0 };
}

async function getMyRating(comicType, comicId, userId) {
  const r = await db.query(
    `SELECT rating FROM comic_ratings WHERE comic_type=$1 AND comic_id=$2 AND user_id=$3 LIMIT 1`,
    [comicType, comicId, userId]
  );
  return r.rows[0]?.rating || 0;
}

async function upsertRating(comicType, comicId, userId, rating) {
  await db.query(
    `INSERT INTO comic_ratings (comic_type, comic_id, user_id, rating, created_at, updated_at)
     VALUES ($1,$2,$3,$4,NOW(),NOW())
     ON CONFLICT (comic_type, comic_id, user_id)
     DO UPDATE SET rating=EXCLUDED.rating, updated_at=NOW()`,
    [comicType, comicId, userId, rating]
  );
  return getSummary(comicType, comicId);
}

module.exports = { ensureComicExists, getSummary, getMyRating, upsertRating };
