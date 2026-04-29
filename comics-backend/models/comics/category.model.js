const db = require("../../db");

async function list() {
  const r = await db.query(`SELECT id, name, created_at FROM categories ORDER BY id DESC`);
  return r.rows;
}

async function getById(id) {
  const r = await db.query(`SELECT id, name, created_at FROM categories WHERE id=$1`, [id]);
  return r.rows[0] || null;
}

async function findByName(name) {
  const r = await db.query(
    `SELECT id, name, created_at FROM categories WHERE LOWER(TRIM(name))=LOWER(TRIM($1)) LIMIT 1`,
    [name]
  );
  return r.rows[0] || null;
}

async function create(name) {
  const r = await db.query(
    `INSERT INTO categories (name) VALUES ($1) RETURNING id, name, created_at`,
    [name]
  );
  return r.rows[0];
}

async function update(id, name) {
  const r = await db.query(
    `UPDATE categories SET name=$1 WHERE id=$2 RETURNING *`,
    [name, id]
  );
  return r.rows[0] || null;
}

async function remove(id) {
  const r = await db.query(`DELETE FROM categories WHERE id=$1 RETURNING id`, [id]);
  return r.rows[0] || null;
}

module.exports = { list, getById, findByName, create, update, remove };
