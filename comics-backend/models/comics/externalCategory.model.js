const db = require("../../db");

async function list() {
  const r = await db.query(
    `SELECT id, api_id, name, slug FROM external_categories ORDER BY name ASC`
  );
  return r.rows;
}

module.exports = { list };
