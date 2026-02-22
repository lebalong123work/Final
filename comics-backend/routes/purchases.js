const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth } = require("../middleware/auth");


router.get("/access/:slug", auth, async (req, res) => {
  try {
    const userId = req.user.id; 
    const { slug } = req.params;

    const pr = await db.query(
      `SELECT is_paid, price FROM external_comics WHERE slug=$1 LIMIT 1`,
      [slug]
    );

    if (pr.rows.length && pr.rows[0].is_paid === false) {
      return res.json({ success: true, hasAccess: true, reason: "free" });
    }

    const r = await db.query(
      `SELECT 1 FROM comic_purchases WHERE user_id=$1 AND comic_slug=$2 LIMIT 1`,
      [userId, slug]
    );

    return res.json({ success: true, hasAccess: !!r.rows.length });
  } catch (err) {
    console.error("access error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;