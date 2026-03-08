const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/external-categories
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT id, api_id, name, slug
      FROM external_categories
      ORDER BY name ASC
    `;

    const { rows } = await db.query(sql);

    return res.json({
      success: true,
      total: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("GET /api/external-categories error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh mục",
    });
  }
});

module.exports = router;