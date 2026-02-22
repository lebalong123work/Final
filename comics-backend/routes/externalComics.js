const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/external-comics?page=1&limit=12&q=...&category=action
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
    const offset = (page - 1) * limit;

    const q = (req.query.q || "").trim();
    const category = (req.query.category || "").trim();

    const params = [];
    const where = [];
    let joinCategory = "";

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      where.push(`LOWER(c.name) LIKE $${params.length}`);
    }

    if (category) {
      params.push(category);
      joinCategory = `
        JOIN external_comic_categories cc ON cc.comic_id = c.id
        JOIN external_categories cat ON cat.id = cc.category_id
      `;
      where.push(`(cat.slug = $${params.length} OR cat.api_id = $${params.length})`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalRes = await db.query(
      `
      SELECT COUNT(DISTINCT c.id)::int AS total
      FROM external_comics c
      ${joinCategory}
      ${whereSql}
      `,
      params
    );
    const total = totalRes.rows[0]?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    params.push(limit);
    params.push(offset);

    const dataRes = await db.query(
      `
      SELECT
        c.id, c.api_id, c.name, c.slug, c.origin_name, c.status,
        c.thumb_url, c.sub_docquyen, c.updated_at, c.created_at,
        c.is_paid, c.price,

        lc.chapter_name AS latest_chapter,
        lc.chapter_api_data AS latest_chapter_api,

        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('api_id', cat2.api_id, 'name', cat2.name, 'slug', cat2.slug)
          ) FILTER (WHERE cat2.id IS NOT NULL),
          '[]'::json
        ) AS categories

      FROM external_comics c
      LEFT JOIN external_latest_chapters lc ON lc.comic_id = c.id
      LEFT JOIN external_comic_categories cc2 ON cc2.comic_id = c.id
      LEFT JOIN external_categories cat2 ON cat2.id = cc2.category_id

      ${joinCategory ? "" : ""}
      ${whereSql}

      GROUP BY c.id, lc.chapter_name, lc.chapter_api_data
      ORDER BY COALESCE(c.updated_at, c.created_at) DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params
    );

    return res.json({ success: true, page, limit, total, totalPages, data: dataRes.rows });
  } catch (err) {
    console.error("GET /api/external-comics error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:slug/pricing", async (req, res) => {
  try {
    const { slug } = req.params;

    const r = await db.query(
      `SELECT api_id, slug, name, is_paid, price
       FROM external_comics
       WHERE slug = $1 OR api_id = $1
       LIMIT 1`,
      [slug]
    );

    if (!r.rows.length) {
      // Không có trong DB => coi như miễn phí (vẫn đọc được từ otruyeanapi)
      return res.json({ success: true, data: { is_paid: false, price: 0 } });
    }

    return res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error("GET pricing error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;