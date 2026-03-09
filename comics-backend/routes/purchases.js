const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth } = require("../middleware/auth");

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ======================================================
// GET /api/purchases/access/:slug
// kiểm tra quyền truy cập truyện external
// ======================================================
router.get("/access/:slug", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { slug } = req.params;

    const comicRes = await db.query(
      `
      SELECT id, is_paid, price
      FROM external_comics
      WHERE slug = $1
      LIMIT 1
      `,
      [slug]
    );

    if (!comicRes.rows.length) {
      return res.status(404).json({ message: "Không tìm thấy truyện" });
    }

    const comic = comicRes.rows[0];

    if (!comic.is_paid || Number(comic.price || 0) <= 0) {
      return res.json({
        success: true,
        hasAccess: true,
        reason: "free",
      });
    }

    const purchaseRes = await db.query(
      `
      SELECT 1
      FROM comic_purchases
      WHERE user_id = $1
        AND comic_type = 'external'
        AND external_comic_id = $2
      LIMIT 1
      `,
      [userId, comic.id]
    );

    return res.json({
      success: true,
      hasAccess: !!purchaseRes.rows.length,
      reason: purchaseRes.rows.length ? "purchased" : "locked",
    });
  } catch (err) {
    console.error("access external error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ======================================================
// GET /api/purchases/access-self/:id
// kiểm tra quyền truy cập truyện tự đăng
// ======================================================
router.get("/access-self/:id", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const comicId = toInt(req.params.id, 0);

    if (!comicId) {
      return res.status(400).json({ message: "ID truyện không hợp lệ" });
    }

    const comicRes = await db.query(
      `
      SELECT id, user_id, is_paid, price
      FROM self_comics
      WHERE id = $1
      LIMIT 1
      `,
      [comicId]
    );

    if (!comicRes.rows.length) {
      return res.status(404).json({ message: "Không tìm thấy truyện tự đăng" });
    }

    const comic = comicRes.rows[0];

    // chủ truyện luôn có quyền đọc
    if (Number(comic.user_id) === Number(userId)) {
      return res.json({
        success: true,
        hasAccess: true,
        reason: "owner",
      });
    }

    // truyện miễn phí thì đọc luôn
    if (!comic.is_paid || Number(comic.price || 0) <= 0) {
      return res.json({
        success: true,
        hasAccess: true,
        reason: "free",
      });
    }

    // truyện trả phí thì kiểm tra đã mua chưa
    const purchaseRes = await db.query(
      `
      SELECT 1
      FROM comic_purchases
      WHERE user_id = $1
        AND comic_type = 'self'
        AND self_comic_id = $2
      LIMIT 1
      `,
      [userId, comic.id]
    );

    return res.json({
      success: true,
      hasAccess: !!purchaseRes.rows.length,
      reason: purchaseRes.rows.length ? "purchased" : "locked",
    });
  } catch (err) {
    console.error("access self error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;