const db = require("../../db");
const cloudinary = require("../../utils/cloudinary");

/* ─── Helpers ─── */

function isHttpUrl(v) {
  return /^https?:\/\//i.test(v);
}

function isBase64Image(v) {
  return /^data:image/.test(v);
}

/** Upload cover image to Cloudinary (if base64); return the final URL */
async function uploadCover(image) {
  if (!image) return null;
  if (isHttpUrl(image)) return image;
  if (!isBase64Image(image)) return image;
  const r = await cloudinary.uploader.upload(image, { folder: "self-comics/covers" });
  return r.secure_url;
}

function normalizeText(v) {
  return String(v || "").trim();
}

/* ─── Queries ─── */

/**
 * Get the list of self-published comics with pagination, search, and category filtering.
 */
async function list({ page, limit, q, categoryId }) {
  const offset = (page - 1) * limit;
  const where = [];
  const params = [];
  let idx = 1;

  if (q) {
    where.push(`sc.title ILIKE $${idx++}`);
    params.push(`%${q}%`);
  }

  if (categoryId > 0) {
    where.push(`
      EXISTS (
        SELECT 1 FROM self_comic_categories scc
        WHERE scc.self_comic_id = sc.id AND scc.category_id = $${idx}
      )
    `);
    params.push(categoryId);
    idx++;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countSql = `SELECT COUNT(*)::int AS total FROM self_comics sc ${whereSql}`;
  const listSql = `
    SELECT
      sc.*,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('id', c.id, 'name', c.name))
        FILTER (WHERE c.id IS NOT NULL),
        '[]'
      ) AS categories
    FROM self_comics sc
    LEFT JOIN self_comic_categories scc ON scc.self_comic_id = sc.id
    LEFT JOIN categories c ON c.id = scc.category_id
    ${whereSql}
    GROUP BY sc.id
    ORDER BY sc.updated_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const total = (await db.query(countSql, params)).rows[0].total;
  const rows = (await db.query(listSql, [...params, limit, offset])).rows;

  return { data: rows, page, total, totalPages: Math.ceil(total / limit) };
}

/**
 * Get the details of a specific comic by ID, along with its categories and author name.
 * Returns null if not found.
 */
async function getById(id) {
  const sql = `
    SELECT
      sc.*,
      u.username,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('id', c.id, 'name', c.name))
        FILTER (WHERE c.id IS NOT NULL),
        '[]'
      ) AS categories
    FROM self_comics sc
    LEFT JOIN users u ON u.id = sc.user_id
    LEFT JOIN self_comic_categories scc ON scc.self_comic_id = sc.id
    LEFT JOIN categories c ON c.id = scc.category_id
    WHERE sc.id = $1
    GROUP BY sc.id, u.username
  `;
  const rs = await db.query(sql, [id]);
  return rs.rows[0] || null;
}

/**
 * Create a new self-published comic with a list of categories in a DB transaction.
 * Upload the cover image before INSERT (can be base64 → Cloudinary).
 */
async function create({ userId, title, author, translatedBy, rawCover, desc, totalChapters, status, isPaid, price, categoryIds }) {
  const cover = await uploadCover(rawCover);

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const insert = await client.query(
      `INSERT INTO self_comics
         (user_id, title, author, translated_by, cover_image, description, total_chapters, status, is_paid, price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [userId, title, author, translatedBy, cover, desc, totalChapters, status, isPaid, price]
    );

    const comic = insert.rows[0];

    for (const catId of categoryIds) {
      await client.query(
        `INSERT INTO self_comic_categories (self_comic_id, category_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [comic.id, catId]
      );
    }

    await client.query("COMMIT");
    return comic;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Update a self-published comic — only update the fields that are provided (partial update).
 * Replace the entire list of categories if categoryIds is provided.
 * Returns null if the comic is not found.
 */
async function update(id, { title, author, translatedBy, rawCover, desc, totalChapters, status, isPaid, price, categoryIds }) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const oldRs = await client.query(`SELECT * FROM self_comics WHERE id = $1 LIMIT 1`, [id]);
    if (!oldRs.rows.length) {
      await client.query("ROLLBACK");
      return null;
    }

    const old = oldRs.rows[0];

    const finalTitle        = title !== undefined        ? normalizeText(title)                        : old.title;
    const finalAuthor       = author !== undefined       ? (normalizeText(author) || null)             : old.author;
    const finalTranslatedBy = translatedBy !== undefined ? (normalizeText(translatedBy) || null)       : old.translated_by;
    const finalCover        = rawCover !== undefined     ? await uploadCover(rawCover)                 : old.cover_image;
    const finalDesc         = desc !== undefined         ? normalizeText(desc)                         : old.description;
    const finalTotal        = totalChapters !== undefined ? Math.max(1, Number(totalChapters || 1))   : old.total_chapters;
    const finalStatus       = status !== undefined       ? Number(status)                              : old.status;
    const finalIsPaid       = isPaid !== undefined       ? !!isPaid                                    : old.is_paid;
    const finalPrice        = price !== undefined        ? Math.max(0, Number(price || 0))             : Number(old.price || 0);

    const updateRes = await client.query(
      `UPDATE self_comics
       SET title=$1, author=$2, translated_by=$3, cover_image=$4, description=$5,
           total_chapters=$6, status=$7, is_paid=$8, price=$9, updated_at=NOW()
       WHERE id=$10
       RETURNING *`,
      [finalTitle, finalAuthor, finalTranslatedBy, finalCover, finalDesc,
       finalTotal, finalStatus, finalIsPaid, finalIsPaid ? finalPrice : 0, id]
    );

    if (Array.isArray(categoryIds)) {
      await client.query(`DELETE FROM self_comic_categories WHERE self_comic_id = $1`, [id]);
      for (const catId of categoryIds) {
        await client.query(
          `INSERT INTO self_comic_categories (self_comic_id, category_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [id, catId]
        );
      }
    }

    await client.query("COMMIT");
    return updateRes.rows[0];
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/** Delete a self-published comic by ID. */
async function remove(id) {
  await db.query(`DELETE FROM self_comics WHERE id = $1`, [id]);
}

module.exports = { list, getById, create, update, remove };
