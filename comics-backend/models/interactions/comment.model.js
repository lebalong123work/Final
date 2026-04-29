const db = require("../../db");

async function getCommentsByExternalChapter(chapterId) {
  const { rows } = await db.query(
    `SELECT c.id, c.chapter_type, c.external_chapter_id, c.self_chapter_id,
            c.parent_id, c.text, c.created_at,
            u.id AS user_id, u.username AS user_name
     FROM chapter_comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.chapter_type = 'external' AND c.external_chapter_id = $1
     ORDER BY c.created_at DESC LIMIT 300`,
    [chapterId]
  );
  return rows;
}

async function getCommentsBySelfChapter(selfChapterId) {
  const { rows } = await db.query(
    `SELECT c.id, c.chapter_type, c.external_chapter_id, c.self_chapter_id,
            c.parent_id, c.text, c.created_at,
            u.id AS user_id, u.username AS user_name
     FROM chapter_comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.chapter_type = 'self' AND c.self_chapter_id = $1
     ORDER BY c.created_at DESC LIMIT 300`,
    [selfChapterId]
  );
  return rows;
}

async function createExternalComment(chapterId, userId, parentId, text) {
  const { rows } = await db.query(
    `INSERT INTO chapter_comments (chapter_type, external_chapter_id, user_id, parent_id, text)
     VALUES ('external', $1, $2, $3, $4)
     RETURNING id, chapter_type, external_chapter_id, self_chapter_id, parent_id, text, created_at`,
    [chapterId, userId, parentId, text]
  );
  return rows[0];
}

async function createSelfComment(selfChapterId, userId, parentId, text) {
  const { rows } = await db.query(
    `INSERT INTO chapter_comments (chapter_type, self_chapter_id, user_id, parent_id, text)
     VALUES ('self', $1, $2, $3, $4)
     RETURNING id, chapter_type, external_chapter_id, self_chapter_id, parent_id, text, created_at`,
    [selfChapterId, userId, parentId, text]
  );
  return rows[0];
}

async function findCommentById(id) {
  const { rows } = await db.query(
    `SELECT id, user_id, chapter_type, external_chapter_id, self_chapter_id
     FROM chapter_comments WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function deleteComment(id) {
  await db.query(`DELETE FROM chapter_comments WHERE id = $1`, [id]);
}

async function getUsernameById(userId) {
  const { rows } = await db.query(`SELECT username FROM users WHERE id = $1`, [userId]);
  return rows[0]?.username || "User";
}

async function getMyCommentStats(userId) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total_comments,
            COUNT(CASE WHEN chapter_type = 'external' THEN 1 END)::int AS external_comments,
            COUNT(CASE WHEN chapter_type = 'self' THEN 1 END)::int AS self_comments
     FROM chapter_comments WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || { total_comments: 0, external_comments: 0, self_comments: 0 };
}

module.exports = {
  getCommentsByExternalChapter,
  getCommentsBySelfChapter,
  createExternalComment,
  createSelfComment,
  findCommentById,
  deleteComment,
  getUsernameById,
  getMyCommentStats,
};
