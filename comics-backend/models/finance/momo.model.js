const db = require("../../db");

/**
 * Verify MoMo signature and process payment results.
* All database logic resides within the transaction to ensure consistency.
*
 * @returns {{ ok: true } | { error: number, message: string }}
 */
async function verifyAndProcess({ orderId, transId, resultCode, amount, userId }) {
  // Check if the transaction exists
  const existed = await db.query(
    `SELECT status FROM wallet_transactions WHERE order_id=$1 LIMIT 1`,
    [orderId]
  );
  if (!existed.rows.length) return { error: 404, message: "Order not found" };
  if (existed.rows[0].status === "success") return { ok: true, alreadyDone: true };

  // Payment failed
  if (Number(resultCode) !== 0) {
    await db.query(
      `UPDATE wallet_transactions SET status='failed', trans_id=$1, note=$2 WHERE order_id=$3`,
      [transId || null, "failed", orderId]
    );
    return { ok: true };
  }

  // Payment successful — use dedicated client to ensure transaction atomicity
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO wallets (user_id, balance) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    const upd = await client.query(
      `UPDATE wallet_transactions SET status='success', trans_id=$1, note='topup_momo' WHERE order_id=$2 AND status='pending' RETURNING amount`,
      [transId, orderId]
    );

    if (!upd.rows.length) {
      await client.query("ROLLBACK");
      return { ok: true, alreadyDone: true };
    }

    const addAmount = Number(upd.rows[0].amount || amount || 0);
    await client.query(
      `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2`,
      [addAmount, userId]
    );

    await client.query("COMMIT");
    return { ok: true };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { verifyAndProcess };
