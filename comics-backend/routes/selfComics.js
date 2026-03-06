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

/**
 * GET /api/self-comics
 * Query:
 * - page
 * - limit
 * - q
 * - categoryId
 *
 * admin: xem tất cả
 * user: chỉ xem truyện của mình
 */
router.get("/", auth, async (req, res) => {
  try {
    const page = normalizePage(req.query.page, 1);
    const limit = normalizeLimit(req.query.limit, 12);
    const offset = (page - 1) * limit;
    const q = String(req.query.q || "").trim();
    const categoryId = req.query.categoryId ? toInt(req.query.categoryId, 0) : null;

    const where = [];
    const params = [];
    let idx = 1;

    if (!canManageAll(req.user)) {
      where.push(`sc.user_id = $${idx++}`);
      params.push(req.user.id);
    }

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
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const listParams = [...params, limit, offset];
    const listResult = await db.query(listSql, listParams);

    return res.json({
      data: listResult.rows,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    console.error("GET /api/self-comics error:", err);
    return res.status(500).json({ message: "Lỗi server khi tải self comics" });
  }
});

/**
 * GET /api/self-comics/:id
 * admin: xem bất kỳ
 * user: chỉ xem truyện của mình
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);
    if (!id) return res.status(400).json({ message: "ID không hợp lệ" });

    const params = [id];
    let extraWhere = "";

    if (!canManageAll(req.user)) {
      params.push(req.user.id);
      extraWhere = ` AND sc.user_id = $2`;
    }

    const sql = `
      SELECT
        sc.id,
        sc.user_id,
        sc.title,
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
      WHERE sc.id = $1
      ${extraWhere}
      LIMIT 1
    `;

    const result = await db.query(sql, params);
    if (!result.rows.length) {
      return res.status(404).json({ message: "Không tìm thấy truyện" });
    }

    return res.json({ data: result.rows[0] });
  } catch (err) {
    console.error("GET /api/self-comics/:id error:", err);
    return res.status(500).json({ message: "Lỗi server khi lấy chi tiết truyện" });
  }
});

/**
 * POST /api/self-comics
 * body:
 * - title
 * - cover_image
 * - description
 * - total_chapters
 * - status
 * - category_id
 * - is_paid
 * - price
 */
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const title = normalizeText(req.body.title);
    const coverImage = normalizeText(req.body.cover_image) || null;
    const description = normalizeText(req.body.description) || null;
    const totalChapters = Math.max(1, toInt(req.body.total_chapters, 1));
    const status = Number(req.body.status ?? 1);
    const categoryId = req.body.category_id ? toInt(req.body.category_id, 0) : null;
    const isPaid = !!req.body.is_paid;
    const price = Math.max(0, toInt(req.body.price, 0));

    if (!userId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    if (!title) {
      return res.status(400).json({ message: "Vui lòng nhập tiêu đề" });
    }

    if (totalChapters < 1) {
      return res.status(400).json({ message: "Tổng số chương phải lớn hơn hoặc bằng 1" });
    }

    if (![0, 1].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    if (isPaid && price <= 0) {
      return res.status(400).json({ message: "Giá phải lớn hơn 0 khi bật trả phí" });
    }

    if (categoryId) {
      const catCheck = await db.query(
        `SELECT id, name FROM categories WHERE id = $1 LIMIT 1`,
        [categoryId]
      );
      if (!catCheck.rows.length) {
        return res.status(400).json({ message: "Danh mục không tồn tại" });
      }
    }

    const insertSql = `
      INSERT INTO self_comics (
        user_id,
        title,
        cover_image,
        description,
        total_chapters,
        status,
        category_id,
        is_paid,
        price
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        user_id,
        title,
        cover_image,
        description,
        total_chapters,
        status,
        created_at,
        updated_at,
        category_id,
        is_paid,
        price
    `;

    const result = await db.query(insertSql, [
      userId,
      title,
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
    console.error("POST /api/self-comics error:", err);
    return res.status(500).json({ message: "Lỗi server khi tạo truyện" });
  }
});

/**
 * PATCH /api/self-comics/:id
 * admin: sửa bất kỳ
 * user: chỉ sửa truyện của mình
 */
router.patch("/:id", auth, async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);
    if (!id) return res.status(400).json({ message: "ID không hợp lệ" });

    const check = await db.query(
      `SELECT * FROM self_comics WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (!check.rows.length) {
      return res.status(404).json({ message: "Không tìm thấy truyện" });
    }

    const comic = check.rows[0];

    if (!canManageAll(req.user) && Number(comic.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Bạn không có quyền sửa truyện này" });
    }

    const title =
      req.body.title !== undefined ? normalizeText(req.body.title) : comic.title;

    const coverImage =
      req.body.cover_image !== undefined
        ? normalizeText(req.body.cover_image) || null
        : comic.cover_image;

    const description =
      req.body.description !== undefined
        ? normalizeText(req.body.description) || null
        : comic.description;

    const totalChapters =
      req.body.total_chapters !== undefined
        ? Math.max(1, toInt(req.body.total_chapters, 1))
        : Math.max(1, toInt(comic.total_chapters, 1));

    const status =
      req.body.status !== undefined ? Number(req.body.status) : Number(comic.status);

    const categoryId =
      req.body.category_id !== undefined
        ? (req.body.category_id ? toInt(req.body.category_id, 0) : null)
        : comic.category_id;

    const isPaid =
      req.body.is_paid !== undefined ? !!req.body.is_paid : !!comic.is_paid;

    const price =
      req.body.price !== undefined
        ? Math.max(0, toInt(req.body.price, 0))
        : toInt(comic.price, 0);

    if (!title) {
      return res.status(400).json({ message: "Tiêu đề không được để trống" });
    }

    if (totalChapters < 1) {
      return res.status(400).json({ message: "Tổng số chương phải lớn hơn hoặc bằng 1" });
    }

    if (![0, 1].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    if (isPaid && price <= 0) {
      return res.status(400).json({ message: "Giá phải lớn hơn 0 khi bật trả phí" });
    }

    if (categoryId) {
      const catCheck = await db.query(
        `SELECT id FROM categories WHERE id = $1 LIMIT 1`,
        [categoryId]
      );
      if (!catCheck.rows.length) {
        return res.status(400).json({ message: "Danh mục không tồn tại" });
      }
    }

    const updateSql = `
      UPDATE self_comics
      SET
        title = $1,
        cover_image = $2,
        description = $3,
        total_chapters = $4,
        status = $5,
        category_id = $6,
        is_paid = $7,
        price = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING
        id,
        user_id,
        title,
        cover_image,
        description,
        total_chapters,
        status,
        created_at,
        updated_at,
        category_id,
        is_paid,
        price
    `;

    const result = await db.query(updateSql, [
      title,
      coverImage,
      description,
      totalChapters,
      status,
      categoryId || null,
      isPaid,
      isPaid ? price : 0,
      id,
    ]);

    return res.json({
      message: "Cập nhật truyện thành công",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("PATCH /api/self-comics/:id error:", err);
    return res.status(500).json({ message: "Lỗi server khi cập nhật truyện" });
  }
});

/**
 * DELETE /api/self-comics/:id
 * admin: xoá bất kỳ
 * user: chỉ xoá truyện của mình
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);
    if (!id) return res.status(400).json({ message: "ID không hợp lệ" });

    const check = await db.query(
      `
      SELECT id, user_id, title, cover_image, total_chapters
      FROM self_comics
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (!check.rows.length) {
      return res.status(404).json({ message: "Không tìm thấy truyện" });
    }

    const comic = check.rows[0];

    if (!canManageAll(req.user) && Number(comic.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Bạn không có quyền xoá truyện này" });
    }

    await db.query(`DELETE FROM self_comics WHERE id = $1`, [id]);

    return res.json({
      message: "Xoá truyện thành công",
      data: {
        id: comic.id,
        title: comic.title,
        cover_image: comic.cover_image,
        total_chapters: comic.total_chapters,
      },
    });
  } catch (err) {
    console.error("DELETE /api/self-comics/:id error:", err);
    return res.status(500).json({ message: "Lỗi server khi xoá truyện" });
  }
});

module.exports = router;