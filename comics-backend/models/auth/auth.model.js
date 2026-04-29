const db = require("../../db");

async function findUserWithRoleById(id) {
  const { rows } = await db.query(
    `SELECT u.id, u.username, u.email, u.phone, u.provider, u.google_id, u.status,
            r.code AS role_code
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findRoleByCode(code) {
  const { rows } = await db.query(
    `SELECT id FROM roles WHERE code = $1 LIMIT 1`,
    [code]
  );
  return rows[0] || null;
}

async function createLocalUser(username, email, phone, passwordHash, roleId) {
  const { rows } = await db.query(
    `INSERT INTO users (username, email, phone, provider, password_hash, role_id)
     VALUES ($1, $2, $3, 'local', $4, $5)
     RETURNING id`,
    [username, email, phone, passwordHash, roleId]
  );
  return rows[0];
}

async function findLocalUserByEmail(email) {
  const { rows } = await db.query(
    `SELECT u.*, r.code AS role_code
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = $1 AND u.provider = 'local'
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findGoogleUserById(googleId) {
  const { rows } = await db.query(
    `SELECT u.id FROM users u
     WHERE u.google_id = $1 AND u.provider = 'google'
     LIMIT 1`,
    [googleId]
  );
  return rows[0] || null;
}

async function findUserByEmail(email) {
  const { rows } = await db.query(
    `SELECT id, provider FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function linkGoogleId(userId, googleId) {
  await db.query(`UPDATE users SET google_id = $1 WHERE id = $2`, [googleId, userId]);
}

async function createGoogleUser(username, email, googleId, roleId) {
  const { rows } = await db.query(
    `INSERT INTO users (username, email, provider, google_id, role_id)
     VALUES ($1, $2, 'google', $3, $4)
     RETURNING id`,
    [username, email, googleId, roleId]
  );
  return rows[0];
}

async function findLocalUserByIdWithStatus(userId) {
  const { rows } = await db.query(
    `SELECT id, email, provider, password_hash, status
     FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function updatePassword(userId, newHash) {
  await db.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [newHash, userId]);
}

async function findLocalUserByEmailForReset(email) {
  const { rows } = await db.query(
    `SELECT id, status FROM users WHERE email = $1 AND provider = 'local' LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

module.exports = {
  findUserWithRoleById,
  findRoleByCode,
  createLocalUser,
  findLocalUserByEmail,
  findGoogleUserById,
  findUserByEmail,
  linkGoogleId,
  createGoogleUser,
  findLocalUserByIdWithStatus,
  updatePassword,
  findLocalUserByEmailForReset,
};
