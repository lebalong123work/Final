const express = require("express");
const router = express.Router();
const db = require("../db");

const { auth } = require("../middleware/auth");
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
    const offset = (page - 1) * limit;

    const q = (req.query.q || "").trim();
    const category = (req.query.category || "").trim();

    const params = [];
    const where = [];

    // q
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      where.push(`LOWER(c.name) LIKE $${params.length}`);
    }

   
    if (category) {
      params.push(category);
      const p = params.length;
      where.push(`
        EXISTS (
          SELECT 1
          FROM external_comic_categories cc
          JOIN external_categories cat ON cat.id = cc.category_id
          WHERE cc.comic_id = c.id
            AND (cat.slug = $${p} OR cat.api_id = $${p})
        )
      `);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // total
    const totalRes = await db.query(
      `
      SELECT COUNT(*)::int AS total
      FROM external_comics c
      ${whereSql}
      `,
      params
    );
    const total = totalRes.rows[0]?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // data
    const dataParams = [...params, limit, offset];
    const dataRes = await db.query(
      `
      SELECT
        c.id, c.api_id, c.name, c.slug, c.origin_name, c.status,
        c.thumb_url, c.sub_docquyen, c.updated_at, c.created_at,
        c.is_paid, c.price, c.translator,

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

      ${whereSql}

      GROUP BY c.id, lc.chapter_name, lc.chapter_api_data
      ORDER BY COALESCE(c.updated_at, c.created_at) DESC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
      `,
      dataParams
    );

    return res.json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      data: dataRes.rows,
    });
  } catch (err) {
    console.error("GET /api/external-comics error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


router.put("/:slug/translator", auth, async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim();
    const userId = Number(req.user?.id || 0);
    const userRole = String(req.user?.role || "").trim();

    let { translator } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!slug) {
      return res.status(400).json({ message: "Thiếu slug hoặc api_id" });
    }

    // cho phép null / rỗng
    if (translator === undefined) {
      return res.status(400).json({ message: "Thiếu trường translator" });
    }

    if (translator === null) {
      translator = null;
    } else {
      translator = String(translator).trim();
      if (!translator) translator = null;
      if (translator && translator.length > 255) {
        return res.status(400).json({ message: "Translator tối đa 255 ký tự" });
      }
    }

    // tìm truyện
    const comicRes = await db.query(
      `
      SELECT id, slug, api_id, name, owner_user_id, translator
      FROM external_comics
      WHERE slug = $1 OR api_id = $1
      LIMIT 1
      `,
      [slug]
    );

    if (!comicRes.rows.length) {
      return res.status(404).json({ message: "Không tìm thấy truyện" });
    }

    const comic = comicRes.rows[0];

    // phân quyền: owner hoặc admin/sub_admin
    const isAdmin = userRole === "admin" || userRole === "sub_admin";
    const isOwner = Number(comic.owner_user_id || 0) === userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Bạn không có quyền cập nhật translator" });
    }

    const updatedRes = await db.query(
      `
      UPDATE external_comics
      SET
        translator = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING
        id,
        api_id,
        slug,
        name,
        translator,
        owner_user_id,
        updated_at
      `,
      [translator, comic.id]
    );

    return res.json({
      success: true,
      message: translator
        ? "Cập nhật translator thành công"
        : "Đã xóa translator thành công",
      data: updatedRes.rows[0],
    });
  } catch (err) {
    console.error("PUT /api/external-comics/:slug/translator error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


router.get("/:slug/pricing", async (req, res) => {
  try {
    const { slug } = req.params;

    const r = await db.query(
      `
      SELECT
        id,
        api_id,
        slug,
        name,
        is_paid,
        price
      FROM external_comics
      WHERE slug = $1 OR api_id = $1
      LIMIT 1
      `,
      [slug]
    );

    if (!r.rows.length) {
      return res.json({
        success: true,
        data: {
          id: null,
          api_id: null,
          slug: slug,
          name: null,
          is_paid: false,
          price: 0,
        },
      });
    }

    return res.json({
      success: true,
      data: r.rows[0],
    });
  } catch (err) {
    console.error("GET pricing error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:slug/owner", async (req, res) => {
  try {
    const slug = req.params.slug;

    const r = await db.query(
      `
      SELECT
        ec.id AS comic_id,
        ec.slug,
        ec.owner_user_id,
        ec.translator,
        u.username
      FROM external_comics ec
      LEFT JOIN users u ON u.id = ec.owner_user_id
      WHERE ec.slug = $1 OR ec.api_id = $1
      LIMIT 1
      `,
      [slug]
    );

    if (r.rowCount === 0) {
      return res.json({
        data: {
          comic_id: null,
          owner_user_id: null,
          username: null,
        },
      });
    }

    return res.json({ data: r.rows[0] });
  } catch (err) {
    console.error("GET owner error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;