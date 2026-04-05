const express = require("express");
const db = require("../db");
const { auth } = require("../middleware/auth");
const cloudinary = require("../utils/cloudinary");

const router = express.Router();

/* ================= HELPERS ================= */

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeText(v) {
  return String(v || "").trim();
}

function isHttpUrl(v) {
  return /^https?:\/\//i.test(v);
}

function isBase64Image(v) {
  return /^data:image/.test(v);
}

async function uploadCover(image) {
  if (!image) return null;

  if (isHttpUrl(image)) return image;

  if (!isBase64Image(image)) return image;

  const r = await cloudinary.uploader.upload(image, {
    folder: "self-comics/covers",
  });

  return r.secure_url;
}

/* ================= GET LIST ================= */

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 12)));
    const offset = (page - 1) * limit;

    const q = normalizeText(req.query.q);
    const categoryId = toInt(req.query.categoryId, 0);

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
          SELECT 1
          FROM self_comic_categories scc
          WHERE scc.self_comic_id = sc.id
          AND scc.category_id = $${idx}
        )
      `);
      params.push(categoryId);
      idx++;
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM self_comics sc
      ${whereSql}
    `;

    const listSql = `
      SELECT
        sc.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', c.id,
              'name', c.name
            )
          ) FILTER (WHERE c.id IS NOT NULL),
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

    res.json({
      data: rows,
      page,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi load list" });
  }
});

/* ================= GET DETAIL ================= */

router.get("/:id", auth, async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);

    const sql = `
      SELECT
        sc.*,
        u.username,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', c.id,
              'name', c.name
            )
          ) FILTER (WHERE c.id IS NOT NULL),
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

    if (!rs.rows.length) {
      return res.status(404).json({ message: "Không tìm thấy" });
    }

    res.json({ data: rs.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi detail" });
  }
});

/* ================= CREATE ================= */

router.post("/", auth, async (req, res) => {
  const client = await db.connect();
  try {
    const userId = req.user.id;

    const title = normalizeText(req.body.title);
    const author = normalizeText(req.body.author) || null;
    const translatedBy = normalizeText(req.body.translated_by) || null;
    const cover = await uploadCover(req.body.cover_image);
    const desc = normalizeText(req.body.description);
    const totalChapters = Math.max(1, Number(req.body.total_chapters || 1));
    const status = Number(req.body.status ?? 1);
    const isPaid = !!req.body.is_paid;
    const price = isPaid ? Math.max(0, Number(req.body.price || 0)) : 0;
    const categoryIds = Array.isArray(req.body.category_ids) ? req.body.category_ids : [];

    if (!title) return res.status(400).json({ message: "Thiếu title" });
    if (!cover) return res.status(400).json({ message: "Thiếu ảnh" });

    await client.query("BEGIN");

    const insert = await client.query(
      `INSERT INTO self_comics
        (user_id, title, author, translated_by, cover_image, description, total_chapters, status, is_paid, price)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [userId, title, author, translatedBy, cover, desc, totalChapters, status, isPaid, price]
    );

    const comic = insert.rows[0];

    for (const catId of categoryIds) {
      await client.query(
        `INSERT INTO self_comic_categories (self_comic_id, category_id)
         VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [comic.id, catId]
      );
    }

    await client.query("COMMIT");
    res.json({ data: comic });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ message: "Lỗi create" });
  } finally {
    client.release();
  }
});

/* ================= UPDATE ================= */

router.patch("/:id", auth, async (req, res) => {
  const client = await db.connect();
  try {
    const id = toInt(req.params.id, 0);

    await client.query("BEGIN");

    const oldRs = await client.query(
      `SELECT * FROM self_comics WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (!oldRs.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Không tìm thấy truyện" });
    }

    const oldComic = oldRs.rows[0];

    const title =
      req.body.title !== undefined ? normalizeText(req.body.title) : oldComic.title;

    const author =
      req.body.author !== undefined
        ? normalizeText(req.body.author) || null
        : oldComic.author;

    const translatedBy =
      req.body.translated_by !== undefined
        ? normalizeText(req.body.translated_by) || null
        : oldComic.translated_by;

    const cover =
      req.body.cover_image !== undefined
        ? await uploadCover(req.body.cover_image)
        : oldComic.cover_image;

    const desc =
      req.body.description !== undefined
        ? normalizeText(req.body.description)
        : oldComic.description;

    const totalChapters =
      req.body.total_chapters !== undefined
        ? Math.max(1, Number(req.body.total_chapters || 1))
        : oldComic.total_chapters;

    const status =
      req.body.status !== undefined
        ? Number(req.body.status)
        : oldComic.status;

    const isPaid =
      req.body.is_paid !== undefined
        ? !!req.body.is_paid
        : oldComic.is_paid;

    const price =
      req.body.price !== undefined
        ? Math.max(0, Number(req.body.price || 0))
        : Number(oldComic.price || 0);

    const update = await client.query(
      `UPDATE self_comics
       SET title=$1,
           author=$2,
           translated_by=$3,
           cover_image=$4,
           description=$5,
           total_chapters=$6,
           status=$7,
           is_paid=$8,
           price=$9,
           updated_at=NOW()
       WHERE id=$10
       RETURNING *`,
      [title, author, translatedBy, cover, desc, totalChapters, status, isPaid, isPaid ? price : 0, id]
    );

    if (Array.isArray(req.body.category_ids)) {
      await client.query(
        `DELETE FROM self_comic_categories WHERE self_comic_id = $1`,
        [id]
      );

      for (const catId of req.body.category_ids) {
        await client.query(
          `INSERT INTO self_comic_categories (self_comic_id, category_id)
           VALUES ($1,$2)
           ON CONFLICT DO NOTHING`,
          [id, catId]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ data: update.rows[0] });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ message: "Lỗi update" });
  } finally {
    client.release();
  }
});

/* ================= DELETE ================= */

router.delete("/:id", auth, async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);

    await db.query(`DELETE FROM self_comics WHERE id=$1`, [id]);

    res.json({ message: "Đã xóa" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi delete" });
  }
});

module.exports = router;