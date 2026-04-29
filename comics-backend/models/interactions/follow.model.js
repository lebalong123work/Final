const db = require("../../db");

async function isFollowing(followerId, followedId) {
  const { rowCount } = await db.query(
    `SELECT 1 FROM user_follows WHERE follower_id = $1 AND followee_id = $2`,
    [followerId, followedId]
  );
  return rowCount > 0;
}

async function follow(followerId, followedId) {
  await db.query(
    `INSERT INTO user_follows (follower_id, followee_id)
     VALUES ($1, $2) ON CONFLICT (follower_id, followee_id) DO NOTHING`,
    [followerId, followedId]
  );
}

async function unfollow(followerId, followedId) {
  await db.query(
    `DELETE FROM user_follows WHERE follower_id = $1 AND followee_id = $2`,
    [followerId, followedId]
  );
}

async function getFollowerCount(userId) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS followers FROM user_follows WHERE followee_id = $1`,
    [userId]
  );
  return rows[0]?.followers || 0;
}

async function getFollowingCount(userId) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS following FROM user_follows WHERE follower_id = $1`,
    [userId]
  );
  return rows[0]?.following || 0;
}

module.exports = { isFollowing, follow, unfollow, getFollowerCount, getFollowingCount };
