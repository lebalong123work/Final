const db = require("../../db");

async function markSelf(userId, comicId, selfChapterId) {
  // Validate comic and chapter exist
  const comicCheck = await db.query(`SELECT id FROM self_comics WHERE id=$1 LIMIT 1`, [comicId]);
  if (!comicCheck.rows.length) return { error: 404, message: "Không tìm thấy truyện self" };

  const chapCheck = await db.query(
    `SELECT id FROM self_comic_chapters WHERE id=$1 AND comic_id=$2 LIMIT 1`,
    [selfChapterId, comicId]
  );
  if (!chapCheck.rows.length) return { error: 404, message: "Không tìm thấy chapter self thuộc truyện này" };

  await db.query(
    `INSERT INTO user_chapter_reads (user_id,comic_type,self_chapter_id,self_comic_id,read_at)
     VALUES ($1,'self',$2,$3,NOW()) ON CONFLICT DO NOTHING`,
    [userId, selfChapterId, comicId]
  );
  await db.query(
    `UPDATE user_chapter_reads SET read_at=NOW() WHERE user_id=$1 AND comic_type='self' AND self_chapter_id=$2`,
    [userId, selfChapterId]
  );
  return { success: true, data: { comicType: "self", comicId, chapterId: selfChapterId } };
}

async function markExternal(userId, comicId, externalChapterId, chapterApi, chapterTitle) {
  const comicCheck = await db.query(`SELECT id FROM external_comics WHERE id=$1 LIMIT 1`, [comicId]);
  if (!comicCheck.rows.length) return { error: 404, message: "Không tìm thấy truyện external" };

  await db.query(
    `INSERT INTO user_chapter_reads (user_id,comic_type,external_chapter_id,external_chapter_api,external_chapter_title,external_comic_id,read_at)
     VALUES ($1,'external',$2,$3,$4,$5,NOW()) ON CONFLICT DO NOTHING`,
    [userId, externalChapterId, chapterApi || null, chapterTitle || null, comicId]
  );
  await db.query(
    `UPDATE user_chapter_reads SET read_at=NOW(), external_chapter_api=COALESCE($3,external_chapter_api), external_chapter_title=COALESCE($4,external_chapter_title)
     WHERE user_id=$1 AND comic_type='external' AND external_chapter_id=$2`,
    [userId, externalChapterId, chapterApi || null, chapterTitle || null]
  );
  return { success: true, data: { comicType: "external", comicId, chapterId: externalChapterId, chapterApi: chapterApi || null, chapterTitle: chapterTitle || null } };
}

async function getByComic(userId, comicType, comicId) {
  let sql, params;
  if (comicType === "self") {
    sql = `SELECT self_chapter_id AS chapter_id, NULL::text AS chapter_api, NULL::text AS chapter_title, read_at FROM user_chapter_reads WHERE user_id=$1 AND comic_type='self' AND self_comic_id=$2 ORDER BY read_at DESC`;
    params = [userId, comicId];
  } else {
    sql = `SELECT external_chapter_id AS chapter_id, external_chapter_api AS chapter_api, external_chapter_title AS chapter_title, read_at FROM user_chapter_reads WHERE user_id=$1 AND comic_type='external' AND external_comic_id=$2 ORDER BY read_at DESC`;
    params = [userId, comicId];
  }
  const r = await db.query(sql, params);
  return r.rows;
}

async function getStats(userId) {
  const r = await db.query(
    `SELECT COUNT(*)::int AS total_chapters_read,
            COUNT(DISTINCT CASE WHEN comic_type='self' THEN self_comic_id END)::int AS total_self_comics_read,
            COUNT(DISTINCT CASE WHEN comic_type='external' THEN external_comic_id END)::int AS total_external_comics_read,
            COUNT(DISTINCT CASE WHEN comic_type='self' THEN CONCAT('self:',self_comic_id) WHEN comic_type='external' THEN CONCAT('external:',external_comic_id) END)::int AS total_comics_read
     FROM user_chapter_reads WHERE user_id=$1`,
    [userId]
  );
  return r.rows[0] || { total_chapters_read: 0, total_self_comics_read: 0, total_external_comics_read: 0, total_comics_read: 0 };
}

async function getLibrary(userId) {
  const selfResult = await db.query(
    `WITH latest_reads AS (
       SELECT self_comic_id, MAX(read_at) AS last_read_at FROM user_chapter_reads WHERE user_id=$1 AND comic_type='self' AND self_comic_id IS NOT NULL GROUP BY self_comic_id
     ), last_chapter AS (
       SELECT DISTINCT ON (self_comic_id) self_comic_id, self_chapter_id, read_at FROM user_chapter_reads WHERE user_id=$1 AND comic_type='self' ORDER BY self_comic_id, read_at DESC
     ), read_stats AS (
       SELECT self_comic_id, COUNT(*)::int AS read_count FROM user_chapter_reads WHERE user_id=$1 AND comic_type='self' GROUP BY self_comic_id
     )
     SELECT 'self' AS comic_type, sc.id, sc.title, sc.cover_image, sc.status, sc.total_chapters, sc.updated_at, sc.created_at,
            lc.self_chapter_id AS last_read_chapter_id, NULL::text AS last_read_chapter_api, ch.chapter_no AS last_read_chapter_no, ch.chapter_title AS last_read_chapter_title,
            lc.read_at AS last_read_at, rs.read_count
     FROM latest_reads lr JOIN self_comics sc ON sc.id=lr.self_comic_id LEFT JOIN last_chapter lc ON lc.self_comic_id=sc.id LEFT JOIN self_comic_chapters ch ON ch.id=lc.self_chapter_id LEFT JOIN read_stats rs ON rs.self_comic_id=sc.id
     ORDER BY lr.last_read_at DESC`,
    [userId]
  );

  const externalResult = await db.query(
    `WITH latest_reads AS (
       SELECT external_comic_id, MAX(read_at) AS last_read_at FROM user_chapter_reads WHERE user_id=$1 AND comic_type='external' AND external_comic_id IS NOT NULL GROUP BY external_comic_id
     ), last_chapter AS (
       SELECT DISTINCT ON (external_comic_id) external_comic_id, external_chapter_id, external_chapter_api, external_chapter_title, read_at FROM user_chapter_reads WHERE user_id=$1 AND comic_type='external' ORDER BY external_comic_id, read_at DESC
     ), read_stats AS (
       SELECT external_comic_id, COUNT(*)::int AS read_count FROM user_chapter_reads WHERE user_id=$1 AND comic_type='external' GROUP BY external_comic_id
     )
     SELECT 'external' AS comic_type, ec.id, ec.name AS title, ec.thumb_url AS cover_image, ec.status, NULL::int AS total_chapters, ec.updated_at, ec.created_at,
            lc.external_chapter_id AS last_read_chapter_id, lc.external_chapter_api AS last_read_chapter_api, NULL::text AS last_read_chapter_no,
            COALESCE(lc.external_chapter_title,lc.external_chapter_id) AS last_read_chapter_title, lc.read_at AS last_read_at, rs.read_count, ec.slug
     FROM latest_reads lr JOIN external_comics ec ON ec.id=lr.external_comic_id LEFT JOIN last_chapter lc ON lc.external_comic_id=ec.id LEFT JOIN read_stats rs ON rs.external_comic_id=ec.id
     ORDER BY lr.last_read_at DESC`,
    [userId]
  );

  const selfRows = (selfResult.rows || []).map((x) => ({ ...x, slug: null }));
  const merged = [...selfRows, ...(externalResult.rows || [])].sort(
    (a, b) => new Date(b.last_read_at || 0).getTime() - new Date(a.last_read_at || 0).getTime()
  );
  return merged;
}

async function getTopComics(limit) {
  const selfResult = await db.query(
    `SELECT 'self' AS comic_type, sc.id, sc.title, sc.cover_image, sc.status, sc.updated_at, sc.created_at, sc.id::text AS slug, COUNT(*)::int AS read_count
     FROM user_chapter_reads ucr JOIN self_comics sc ON sc.id=ucr.self_comic_id WHERE ucr.comic_type='self' AND ucr.self_comic_id IS NOT NULL
     GROUP BY sc.id, sc.title, sc.cover_image, sc.status, sc.updated_at, sc.created_at`
  );
  const externalResult = await db.query(
    `SELECT 'external' AS comic_type, ec.id, ec.name AS title, ec.thumb_url AS cover_image, ec.status, ec.updated_at, ec.created_at, ec.slug, COUNT(*)::int AS read_count
     FROM user_chapter_reads ucr JOIN external_comics ec ON ec.id=ucr.external_comic_id WHERE ucr.comic_type='external' AND ucr.external_comic_id IS NOT NULL
     GROUP BY ec.id, ec.name, ec.thumb_url, ec.status, ec.updated_at, ec.created_at, ec.slug`
  );

  return [...(selfResult.rows || []), ...(externalResult.rows || [])]
    .sort((a, b) => {
      const diff = Number(b.read_count || 0) - Number(a.read_count || 0);
      if (diff !== 0) return diff;
      return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
    })
    .slice(0, limit)
    .map((item, idx) => ({ ...item, badge: idx === 0 ? "HOT" : idx === 1 ? "TOP" : "NEW" }));
}

module.exports = { markSelf, markExternal, getByComic, getStats, getLibrary, getTopComics };
