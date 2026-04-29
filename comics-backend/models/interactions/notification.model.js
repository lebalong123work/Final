const db = require("../../db");

async function getNotificationsByUser(userId) {
  const { rows } = await db.query(
    `SELECT n.*, u.username AS actor_username
     FROM notifications n
     LEFT JOIN users u ON u.id = n.actor_user_id
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC LIMIT 50`,
    [userId]
  );
  return rows;
}

async function getUnreadCount(userId) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS unread FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  return rows[0]?.unread || 0;
}

async function markAsRead(notifId, userId) {
  await db.query(
    `UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2`,
    [notifId, userId]
  );
}

module.exports = { getNotificationsByUser, getUnreadCount, markAsRead };
