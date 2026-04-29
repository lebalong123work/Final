const db = require("../../db");

function normalizeText(v) { return String(v || "").trim(); }
function toInt(v, f = 0) { const n = Number(v); return Number.isFinite(n) ? n : f; }
function isValidComicType(t) { return t === "external" || t === "self"; }

async function _ensureComicExists(client, comicType, comicId) {
  if (comicType === "external") {
    const r = await client.query(`SELECT id, slug, name FROM external_comics WHERE id=$1 LIMIT 1`, [comicId]);
    return r.rows[0] || null;
  }
  const r = await client.query(`SELECT id, title FROM self_comics WHERE id=$1 LIMIT 1`, [comicId]);
  return r.rows[0] || null;
}

async function getChapterReactions(chapterId, comicId, comicType, userId) {
  let countRes, likedRes = { rows: [] };
  if (comicId > 0 && isValidComicType(comicType)) {
    countRes = await db.query(`SELECT COUNT(*)::int AS cnt FROM chapter_reactions WHERE chapter_id=$1 AND comic_id=$2 AND comic_type=$3`, [chapterId, comicId, comicType]);
    if (userId) likedRes = await db.query(`SELECT 1 FROM chapter_reactions WHERE chapter_id=$1 AND comic_id=$2 AND comic_type=$3 AND user_id=$4 LIMIT 1`, [chapterId, comicId, comicType, userId]);
  } else {
    countRes = await db.query(`SELECT COUNT(*)::int AS cnt FROM chapter_reactions WHERE chapter_id=$1`, [chapterId]);
    if (userId) likedRes = await db.query(`SELECT 1 FROM chapter_reactions WHERE chapter_id=$1 AND user_id=$2 LIMIT 1`, [chapterId, userId]);
  }
  return { likeCount: Number(countRes.rows[0]?.cnt || 0), liked: likedRes.rows.length > 0 };
}

async function toggleReaction(userId, chapterId, comicId, comicType, slug, chapApi, chapterTitle) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const comic = await _ensureComicExists(client, comicType, comicId);
    if (!comic) {
      await client.query("ROLLBACK");
      return { error: 404, message: comicType === "external" ? "Không tìm thấy truyện external" : "Không tìm thấy truyện self" };
    }

    const existed = await client.query(
      `SELECT id FROM chapter_reactions WHERE user_id=$1 AND comic_type=$2 AND comic_id=$3 AND chapter_id=$4 LIMIT 1`,
      [userId, comicType, comicId, chapterId]
    );

    let liked;
    if (existed.rows.length) {
      await client.query(`DELETE FROM chapter_reactions WHERE user_id=$1 AND comic_type=$2 AND comic_id=$3 AND chapter_id=$4`, [userId, comicType, comicId, chapterId]);
      liked = false;
    } else {
      await client.query(
        `INSERT INTO chapter_reactions (chapter_id,user_id,comic_id,comic_type,slug,chap_api,chapter_title,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [chapterId, userId, comicId, comicType, slug || null, chapApi || null, chapterTitle || null]
      );
      liked = true;
    }

    const countRes = await client.query(
      `SELECT COUNT(*)::int AS cnt FROM chapter_reactions WHERE comic_type=$1 AND comic_id=$2 AND chapter_id=$3`,
      [comicType, comicId, chapterId]
    );
    await client.query("COMMIT");
    return { success: true, data: { liked, likeCount: Number(countRes.rows[0]?.cnt || 0), comicId, comicType, chapterId, chapterTitle: chapterTitle || null } };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getComicReactions(comicType, comicId, userId) {
  const countRes = await db.query(
    `SELECT COUNT(DISTINCT user_id)::int AS cnt FROM chapter_reactions WHERE comic_type=$1 AND comic_id=$2`,
    [comicType, comicId]
  );
  let liked = false;
  if (userId) {
    const r = await db.query(`SELECT 1 FROM chapter_reactions WHERE user_id=$1 AND comic_type=$2 AND comic_id=$3 LIMIT 1`, [userId, comicType, comicId]);
    liked = r.rows.length > 0;
  }
  return { liked, likeCount: Number(countRes.rows[0]?.cnt || 0) };
}

async function getMyLiked(userId, comicType, comicId) {
  const r = await db.query(`SELECT 1 FROM chapter_reactions WHERE user_id=$1 AND comic_type=$2 AND comic_id=$3 LIMIT 1`, [userId, comicType, comicId]);
  return r.rows.length > 0;
}

async function getLibrary(userId) {
  const selfRes = await db.query(
    `SELECT DISTINCT ON (cr.comic_id) 'self' AS comic_type, sc.id, sc.title, sc.cover_image, sc.status, sc.updated_at, sc.created_at, NULL::text AS slug,
            cr.chapter_id AS last_chapter_id, cr.chapter_title AS last_chapter_title, cr.chap_api AS last_chapter_api, cr.created_at AS favorited_at
     FROM chapter_reactions cr JOIN self_comics sc ON sc.id=cr.comic_id WHERE cr.user_id=$1 AND cr.comic_type='self' ORDER BY cr.comic_id, cr.created_at DESC`,
    [userId]
  );
  const externalRes = await db.query(
    `SELECT DISTINCT ON (cr.comic_id) 'external' AS comic_type, ec.id, ec.name AS title, ec.thumb_url AS cover_image, ec.status, ec.updated_at, ec.created_at,
            COALESCE(cr.slug,ec.slug) AS slug, cr.chapter_id AS last_chapter_id, cr.chapter_title AS last_chapter_title, cr.chap_api AS last_chapter_api, cr.created_at AS favorited_at
     FROM chapter_reactions cr JOIN external_comics ec ON ec.id=cr.comic_id WHERE cr.user_id=$1 AND cr.comic_type='external' ORDER BY cr.comic_id, cr.created_at DESC`,
    [userId]
  );
  return [...(selfRes.rows || []), ...(externalRes.rows || [])].sort(
    (a, b) => new Date(b.favorited_at || 0).getTime() - new Date(a.favorited_at || 0).getTime()
  );
}

async function getTopComics(limit) {
  const selfRes = await db.query(
    `SELECT 'self' AS comic_type, sc.id, sc.title, sc.cover_image, sc.status, NULL::text AS slug, COUNT(DISTINCT cr.user_id)::int AS like_count
     FROM chapter_reactions cr JOIN self_comics sc ON sc.id=cr.comic_id WHERE cr.comic_type='self' GROUP BY sc.id,sc.title,sc.cover_image,sc.status`
  );
  const externalRes = await db.query(
    `SELECT 'external' AS comic_type, ec.id, ec.name AS title, ec.thumb_url AS cover_image, ec.status, ec.slug, COUNT(DISTINCT cr.user_id)::int AS like_count
     FROM chapter_reactions cr JOIN external_comics ec ON ec.id=cr.comic_id WHERE cr.comic_type='external' GROUP BY ec.id,ec.name,ec.thumb_url,ec.status,ec.slug`
  );
  return [...(selfRes.rows || []), ...(externalRes.rows || [])]
    .sort((a, b) => Number(b.like_count || 0) - Number(a.like_count || 0))
    .slice(0, limit);
}

async function getLatestLiked(limit) {
  const selfRes = await db.query(
    `SELECT DISTINCT ON (cr.comic_id) 'self' AS comic_type, sc.id, sc.title, sc.cover_image, sc.status, NULL::text AS slug, cr.created_at AS liked_at
     FROM chapter_reactions cr JOIN self_comics sc ON sc.id=cr.comic_id WHERE cr.comic_type='self' ORDER BY cr.comic_id, cr.created_at DESC`
  );
  const externalRes = await db.query(
    `SELECT DISTINCT ON (cr.comic_id) 'external' AS comic_type, ec.id, ec.name AS title, ec.thumb_url AS cover_image, ec.status, ec.slug, cr.created_at AS liked_at
     FROM chapter_reactions cr JOIN external_comics ec ON ec.id=cr.comic_id WHERE cr.comic_type='external' ORDER BY cr.comic_id, cr.created_at DESC`
  );
  return [...(selfRes.rows || []), ...(externalRes.rows || [])]
    .sort((a, b) => new Date(b.liked_at || 0).getTime() - new Date(a.liked_at || 0).getTime())
    .slice(0, limit);
}

module.exports = { getChapterReactions, toggleReaction, getComicReactions, getMyLiked, getLibrary, getTopComics, getLatestLiked };
