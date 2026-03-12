const express = require("express");
const db = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePage(v, fallback = 1) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function normalizeLimit(v, fallback = 12) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 100);
}

function canManageAll(user) {
  return user?.role === "admin";
}

function normalizeText(v) {
  return String(v || "").trim();
}

/*
GET LIST SELF COMICS
*/
router.get("/", auth, async (req, res) => {
  try {
    const page = normalizePage(req.query.page, 1);
    const limit = normalizeLimit(req.query.limit, 12);
    const offset = (page - 1) * limit;

    const q = String(req.query.q || "").trim();
    const categoryId = req.query.categoryId
      ? toInt(req.query.categoryId, 0)
      : null;

    const where = [];
    const params = [];
    let idx = 1;

    if (q) {
      where.push(`sc.title ILIKE $${idx++}`);
      params.push(`%${q}%`);
    }

    if (categoryId) {
      where.push(`sc.category_id = $${idx++}`);
      params.push(categoryId);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM self_comics sc
      ${whereSql}
    `;

    const listSql = `
      SELECT
        sc.id,
        sc.user_id,
        sc.title,
        sc.author,
        sc.translated_by,
        sc.cover_image,
        sc.description,
        sc.total_chapters,
        sc.status,
        sc.created_at,
        sc.updated_at,
        sc.category_id,
        sc.is_paid,
        sc.price,
        c.name AS category_name
      FROM self_comics sc
      LEFT JOIN categories c ON c.id = sc.category_id
      ${whereSql}
      ORDER BY sc.updated_at DESC, sc.id DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const countResult = await db.query(countSql, params);
    const total = countResult.rows[0]?.total || 0;

    const listParams = [...params, limit, offset];
    const listResult = await db.query(listSql, listParams);

    return res.json({
      data: listResult.rows,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error("GET self comics error:", err);
    return res.status(500).json({ message: "Lỗi server khi tải truyện" });
  }
});

/*
GET DETAIL
*/
router.get("/:id", auth, async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);
    if (!id) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const sql = `
      SELECT
        sc.id,
        sc.user_id,
        u.username,
        sc.title,
        sc.author,
        sc.translated_by,
        sc.cover_image,
        sc.description,
        sc.total_chapters,
        sc.status,
        sc.created_at,
        sc.updated_at,
        sc.category_id,
        sc.is_paid,
        sc.price,
        c.name AS category_name
      FROM self_comics sc
      LEFT JOIN categories c ON c.id = sc.category_id
      LEFT JOIN users u ON u.id = sc.user_id
      WHERE sc.id = $1
      LIMIT 1
    `;

    const result = await db.query(sql, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ message: "Không tìm thấy truyện" });
    }

    return res.json({ data: result.rows[0] });
  } catch (err) {
    console.error("GET self comic error:", err);
    return res.status(500).json({ message: "Lỗi server khi lấy truyện" });
  }
});

/*
CREATE COMIC
*/
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user?.id;

    const title = normalizeText(req.body.title);
    const author = normalizeText(req.body.author) || null;
    const translatedBy = normalizeText(req.body.translated_by) || null;
    const coverImage = normalizeText(req.body.cover_image) || null;
    const description = normalizeText(req.body.description) || null;

    const totalChapters = Math.max(1, toInt(req.body.total_chapters, 1));
    const status = Number(req.body.status ?? 1);

    const categoryId = req.body.category_id
      ? toInt(req.body.category_id, 0)
      : null;

    const isPaid = !!req.body.is_paid;
    const price = Math.max(0, toInt(req.body.price, 0));

    if (!userId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    if (!title) {
      return res.status(400).json({ message: "Vui lòng nhập tiêu đề" });
    }

    if (isPaid && price <= 0) {
      return res
        .status(400)
        .json({ message: "Giá phải > 0 khi bật trả phí" });
    }

    const insertSql = `
      INSERT INTO self_comics (
        user_id,
        title,
        author,
        translated_by,
        cover_image,
        description,
        total_chapters,
        status,
        category_id,
        is_paid,
        price
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `;

    const result = await db.query(insertSql, [
      userId,
      title,
      author,
      translatedBy,
      coverImage,
      description,
      totalChapters,
      status,
      categoryId || null,
      isPaid,
      isPaid ? price : 0,
    ]);

    return res.status(201).json({
      message: "Tạo truyện thành công",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("CREATE self comic error:", err);
    return res.status(500).json({ message: "Lỗi server khi tạo truyện" });
  }
});

/*
UPDATE COMIC
*/
router.patch("/:id", auth, async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);
    if (!id) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const check = await db.query(
      `SELECT * FROM self_comics WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (!check.rows.length) {
      return res.status(404).json({ message: "Không tìm thấy truyện" });
    }

    const comic = check.rows[0];

    if (
      !canManageAll(req.user) &&
      Number(comic.user_id) !== Number(req.user.id)
    ) {
      return res.status(403).json({ message: "Không có quyền sửa" });
    }

    const title =
      req.body.title !== undefined
        ? normalizeText(req.body.title)
        : comic.title;

    const author =
      req.body.author !== undefined
        ? normalizeText(req.body.author) || null
        : comic.author;

    const translatedBy =
      req.body.translated_by !== undefined
        ? normalizeText(req.body.translated_by) || null
        : comic.translated_by;

    const coverImage =
      req.body.cover_image !== undefined
        ? normalizeText(req.body.cover_image) || null
        : comic.cover_image;

    const description =
      req.body.description !== undefined
        ? normalizeText(req.body.description) || null
        : comic.description;

    const updateSql = `
      UPDATE self_comics
      SET
        title = $1,
        author = $2,
        translated_by = $3,
        cover_image = $4,
        description = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;

    const result = await db.query(updateSql, [
      title,
      author,
      translatedBy,
      coverImage,
      description,
      id,
    ]);

    return res.json({
      message: "Cập nhật thành công",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("UPDATE comic error:", err);
    return res.status(500).json({ message: "Lỗi server khi cập nhật" });
  }
});

/*
DELETE
*/
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);
    if (!id) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const check = await db.query(
      `SELECT id, user_id, title FROM self_comics WHERE id = $1`,
      [id]
    );

    if (!check.rows.length) {
      return res.status(404).json({ message: "Không tìm thấy truyện" });
    }

    const comic = check.rows[0];

    if (
      !canManageAll(req.user) &&
      Number(comic.user_id) !== Number(req.user.id)
    ) {
      return res.status(403).json({ message: "Không có quyền xoá" });
    }

    await db.query(`DELETE FROM self_comics WHERE id = $1`, [id]);

    return res.json({
      message: "Xoá truyện thành công",
      data: comic,
    });
  } catch (err) {
    console.error("DELETE comic error:", err);
    return res.status(500).json({ message: "Lỗi server khi xoá" });
  }
});

module.exports = router;