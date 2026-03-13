const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth, requireAdmin } = require("../middleware/auth");

function normalizeText(v) {
  return String(v || "").trim().replace(/\s+/g, " ");
}

/**
 * GET /api/categories
 * Lấy danh sách danh mục
 */
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, created_at
       FROM categories
       ORDER BY id DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error("GET categories error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/categories/:id
 * Lấy chi tiết danh mục
 */
router.get("/:id", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, created_at
       FROM categories
       WHERE id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("GET category error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/categories/ensure
 * User nhập tên danh mục:
 * - nếu đã tồn tại -> trả về danh mục cũ
 * - nếu chưa có -> tạo mới rồi trả về
 */
router.post("/ensure", auth, async (req, res) => {
  try {
    const name = normalizeText(req.body.name);

    if (!name) {
      return res.status(400).json({ message: "Thiếu tên danh mục" });
    }

    const existed = await db.query(
      `SELECT id, name, created_at
       FROM categories
       WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
       LIMIT 1`,
      [name]
    );

    if (existed.rows.length > 0) {
      return res.json({
        success: true,
        message: "Danh mục đã tồn tại",
        data: existed.rows[0],
      });
    }

    const result = await db.query(
      `INSERT INTO categories (name)
       VALUES ($1)
       RETURNING id, name, created_at`,
      [name]
    );

    return res.status(201).json({
      success: true,
      message: "Đã tạo danh mục mới",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("ENSURE category error:", err);

    if (err.code === "23505") {
      try {
        const retry = await db.query(
          `SELECT id, name, created_at
           FROM categories
           WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
           LIMIT 1`,
          [normalizeText(req.body.name)]
        );

        if (retry.rows.length > 0) {
          return res.json({
            success: true,
            message: "Danh mục đã tồn tại",
            data: retry.rows[0],
          });
        }
      } catch (e) {
        console.error("ENSURE category retry error:", e);
      }

      return res.status(409).json({
        message: "Danh mục đã tồn tại",
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/categories
 * Thêm danh mục (admin)
 */
router.post("/", auth, requireAdmin, async (req, res) => {
  try {
    const name = normalizeText(req.body.name);

    if (!name) {
      return res.status(400).json({ message: "Thiếu tên danh mục" });
    }

    const result = await db.query(
      `INSERT INTO categories (name)
       VALUES ($1)
       RETURNING *`,
      [name]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("CREATE category error:", err);

    if (err.code === "23505") {
      return res.status(409).json({
        message: "Danh mục đã tồn tại",
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUT /api/categories/:id
 * Cập nhật danh mục
 */
router.put("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const name = normalizeText(req.body.name);

    if (!name) {
      return res.status(400).json({ message: "Thiếu tên danh mục" });
    }

    const result = await db.query(
      `UPDATE categories
       SET name = $1
       WHERE id = $2
       RETURNING *`,
      [name, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("UPDATE category error:", err);

    if (err.code === "23505") {
      return res.status(409).json({
        message: "Danh mục đã tồn tại",
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE /api/categories/:id
 * Xóa danh mục
 */
router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `DELETE FROM categories
       WHERE id = $1
       RETURNING id`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    res.json({
      success: true,
      message: "Đã xóa danh mục",
    });
  } catch (err) {
    console.error("DELETE category error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;