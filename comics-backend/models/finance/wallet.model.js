const db = require("../../db");

async function createPendingTransaction(userId, type, amount, note, orderId) {
  await db.query(
    `INSERT INTO wallet_transactions (user_id, type, amount, note, order_id, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')`,
    [userId, type, amount, note, orderId]
  );
}

async function findTransactionByOrderId(orderId) {
  const { rows } = await db.query(
    `SELECT status FROM wallet_transactions WHERE order_id = $1 LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
}

async function failTransaction(orderId, message) {
  await db.query(
    `UPDATE wallet_transactions SET status = 'failed', note = $1 WHERE order_id = $2`,
    [message, orderId]
  );
}

async function completeTopup(userId, orderId, transId, amount) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO wallets (user_id, balance) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
    const upd = await client.query(
      `UPDATE wallet_transactions SET status='success', trans_id=$1, note='topup_momo'
       WHERE order_id=$2 AND status='pending' RETURNING amount`,
      [transId, orderId]
    );
    if (!upd.rows.length) {
      await client.query("ROLLBACK");
      return false;
    }
    const addAmount = Number(upd.rows[0].amount || amount || 0);
    await client.query(
      `UPDATE wallets SET balance = balance + $1, updated_at = now() WHERE user_id = $2`,
      [addAmount, userId]
    );
    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function getTransactionStatus(userId, orderId) {
  const { rows } = await db.query(
    `SELECT id, order_id, amount, status, trans_id, created_at
     FROM wallet_transactions WHERE user_id = $1 AND order_id = $2 LIMIT 1`,
    [userId, orderId]
  );
  return rows[0] || null;
}

async function getTransactionsPaged(userId, page, limit) {
  const offset = (page - 1) * limit;
  const totalRes = await db.query(
    `SELECT COUNT(*)::int AS total FROM wallet_transactions WHERE user_id = $1`,
    [userId]
  );
  const total = totalRes.rows[0].total;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const { rows } = await db.query(
    `SELECT id, type, amount, note, order_id, trans_id, status, created_at
     FROM wallet_transactions WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return { total, totalPages, rows };
}

module.exports = {
  createPendingTransaction, findTransactionByOrderId,
  failTransaction, completeTopup, getTransactionStatus, getTransactionsPaged,
};
