const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth } = require("../middleware/auth");


router.get("/comic/:slug", async (req, res) => {
  const slug = req.params.slug;

  const summary = await db.query(
    `
    SELECT 
      COALESCE(AVG(rating),0)::float AS avg,
      COUNT(*)::int AS count
    FROM comic_ratings
    WHERE comic_slug=$1
    `,
    [slug]
  );

  let mine = null;
  const auth = req.headers.authorization || "";
  
  return res.json({ data: { summary: summary.rows[0], mine } });
});


router.get("/comic/:slug/mine", auth , async (req, res) => {
  const slug = req.params.slug;
  const userId = req.user.id;

  const r = await db.query(
    `SELECT rating FROM comic_ratings WHERE comic_slug=$1 AND user_id=$2`,
    [slug, userId]
  );

  return res.json({ data: { rating: r.rows[0]?.rating || 0 } });
});

// POST set rating (upsert)
router.post("/comic/:slug", auth , async (req, res) => {
  const slug = req.params.slug;
  const userId = req.user.id;
  const rating = Number(req.body.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "rating phải từ 1-5" });
  }

  await db.query(
    `
    INSERT INTO comic_ratings (comic_slug, user_id, rating)
    VALUES ($1,$2,$3)
    ON CONFLICT (comic_slug, user_id)
    DO UPDATE SET rating=EXCLUDED.rating, updated_at=NOW()
    `,
    [slug, userId, rating]
  );

  const summary = await db.query(
    `
    SELECT 
      COALESCE(AVG(rating),0)::float AS avg,
      COUNT(*)::int AS count
    FROM comic_ratings
    WHERE comic_slug=$1
    `,
    [slug]
  );

  return res.json({ data: { rating, summary: summary.rows[0] } });
});

module.exports = router;