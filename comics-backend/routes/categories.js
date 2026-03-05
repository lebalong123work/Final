const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth, requireAdmin } = require("../middleware/auth");


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
       WHERE id=$1`,
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
 * POST /api/categories
 * Thêm danh mục
 */
router.post("/", auth, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;

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
    const { name } = req.body;

    const result = await db.query(
      `UPDATE categories
       SET name=$1
       WHERE id=$2
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
       WHERE id=$1
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