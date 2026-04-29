const db = require("../../db");

/**
* Get a list of external stories with pagination, search by name, and filter by genre.
* Includes JOIN: latest chapter, genre list.
*/
async function list({ page, limit, q, category }) {
  const offset = (page - 1) * limit;
  const params = [];
  const where = [];

  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where.push(`LOWER(c.name) LIKE $${params.length}`);
  }

  if (category) {
    params.push(category);
    const p = params.length;
    where.push(`
      EXISTS (
        SELECT 1 FROM external_comic_categories cc
        JOIN external_categories cat ON cat.id = cc.category_id
        WHERE cc.comic_id = c.id
          AND (cat.slug = $${p} OR cat.api_id = $${p})
      )
    `);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const totalRes = await db.query(
    `SELECT COUNT(*)::int AS total FROM external_comics c ${whereSql}`,
    params
  );
  const total = totalRes.rows[0]?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const dataParams = [...params, limit, offset];
  const dataRes = await db.query(
    `SELECT
      c.id, c.api_id, c.name, c.slug, c.origin_name, c.status,
      c.thumb_url, c.sub_docquyen, c.updated_at, c.created_at,
      c.is_paid, c.price, c.translator,

      lc.chapter_name     AS latest_chapter,
      lc.chapter_api_data AS latest_chapter_api,

      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object('api_id', cat2.api_id, 'name', cat2.name, 'slug', cat2.slug)
        ) FILTER (WHERE cat2.id IS NOT NULL),
        '[]'::json
      ) AS categories

    FROM external_comics c
    LEFT JOIN external_latest_chapters lc     ON lc.comic_id   = c.id
    LEFT JOIN external_comic_categories cc2   ON cc2.comic_id  = c.id
    LEFT JOIN external_categories cat2        ON cat2.id       = cc2.category_id

    ${whereSql}

    GROUP BY c.id, lc.chapter_name, lc.chapter_api_data
    ORDER BY COALESCE(c.updated_at, c.created_at) DESC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return { total, totalPages, data: dataRes.rows };
}

/**
 * Find a comic by slug or api_id.
 * Used to check permissions before updating the translator.
 * Returns null if not found.
 */
async function findBySlug(slug) {
  const res = await db.query(
    `SELECT id, slug, api_id, name, owner_user_id, translator
     FROM external_comics
     WHERE slug = $1 OR api_id = $1
     LIMIT 1`,
    [slug]
  );
  return res.rows[0] || null;
}

/**
 * Update the translator of a comic.
 * Pass null to remove the translator.
 */
async function updateTranslator(id, translator) {
  const res = await db.query(
    `UPDATE external_comics
     SET translator = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, api_id, slug, name, translator, owner_user_id, updated_at`,
    [translator, id]
  );
  return res.rows[0];
}

/**
 * Get the pricing information for an external comic by slug.
 * Returns null if not found (controller will return default values).
 */
async function getPricing(slug) {
  const r = await db.query(
    `SELECT id, api_id, slug, name, is_paid, price
     FROM external_comics
     WHERE slug = $1 OR api_id = $1
     LIMIT 1`,
    [slug]
  );
  return r.rows[0] || null;
}

/**
 * Get the owner (sync/owner) and translator information for an external comic by slug.
 * Returns null if not found.
 */
async function getOwner(slug) {
  const r = await db.query(
    `SELECT
       ec.id AS comic_id,
       ec.slug,
       ec.owner_user_id,
       ec.translator,
       u.username
     FROM external_comics ec
     LEFT JOIN users u ON u.id = ec.owner_user_id
     WHERE ec.slug = $1 OR ec.api_id = $1
     LIMIT 1`,
    [slug]
  );
  return r.rows[0] || null;
}

module.exports = { list, findBySlug, updateTranslator, getPricing, getOwner };
