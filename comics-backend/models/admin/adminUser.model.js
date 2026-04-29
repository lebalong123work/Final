const db = require("../../db");

async function listUsers({ page, limit, q }) {
  const offset = (page - 1) * limit;
  const params = [];
  let where = "";

  if (q) {
    params.push(`%${q}%`);
    where = `WHERE (u.username ILIKE $1 OR u.email ILIKE $1 OR u.phone ILIKE $1)`;
  }

  const countRes = await db.query(`SELECT COUNT(*)::int AS total FROM users u ${where}`, params);
  const total = countRes.rows[0]?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const listRes = await db.query(
    `SELECT u.id, u.username, u.email, u.phone, u.provider, u.google_id,
            u.status, u.created_at, r.code AS role_code
     FROM users u
     JOIN roles r ON r.id = u.role_id
     ${where}
     ORDER BY u.id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return { total, totalPages, rows: listRes.rows };
}

async function updateUserStatus(id, status) {
  const { rows } = await db.query(
    `UPDATE users SET status = $1 WHERE id = $2
     RETURNING id, username, email, provider, status`,
    [status, id]
  );
  return rows[0] || null;
}

async function updateUserInfo(id, username, phone) {
  const { rows } = await db.query(
    `UPDATE users SET username = COALESCE($1, username), phone = COALESCE($2, phone)
     WHERE id = $3 RETURNING id, username, email, phone, provider, status`,
    [username ?? null, phone ?? null, id]
  );
  return rows[0] || null;
}

async function findRoleByCode(code) {
  const { rows } = await db.query(`SELECT id, code FROM roles WHERE code = $1 LIMIT 1`, [code]);
  return rows[0] || null;
}

async function updateUserRole(id, roleId) {
  const { rows } = await db.query(
    `UPDATE users SET role_id = $1 WHERE id = $2 RETURNING id`,
    [roleId, id]
  );
  return rows[0] || null;
}

async function getUserWithRole(id) {
  const { rows } = await db.query(
    `SELECT u.id, u.username, u.email, r.code AS role_code
     FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  listUsers, updateUserStatus, updateUserInfo,
  findRoleByCode, updateUserRole, getUserWithRole,
};
