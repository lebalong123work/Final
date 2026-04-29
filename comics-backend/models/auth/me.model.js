const db = require("../../db");

async function getUserWithWallet(userId) {
  const u = await db.query(
    `SELECT id, username, email, phone, provider, status FROM users WHERE id=$1 LIMIT 1`,
    [userId]
  );
  if (!u.rows.length) return null;

  const w = await db.query(
    `INSERT INTO wallets (user_id, balance)
     VALUES ($1, 0)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING user_id, balance, updated_at`,
    [userId]
  );
  return { user: u.rows[0], wallet: w.rows[0] };
}

module.exports = { getUserWithWallet };
