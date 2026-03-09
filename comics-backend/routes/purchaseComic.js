const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth } = require("../middleware/auth");

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ======================================================
// BUY EXTERNAL COMIC
// POST /api/purchases/buy/:slug
// ======================================================
router.post("/buy/:slug", auth, async (req, res) => {
  const userId = req.user.id;
  const { slug } = req.params;

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const comicRes = await client.query(
      `
      SELECT
        id,
        api_id,
        slug,
        name,
        is_paid,
        price
      FROM external_comics
      WHERE slug = $1
      LIMIT 1
      `,
      [slug]
    );

    if (!comicRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Không tìm thấy truyện trong DB" });
    }

    const comic = comicRes.rows[0];

    if (!comic.is_paid || toNumber(comic.price, 0) <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Truyện này miễn phí, không cần mua" });
    }

    const price = toNumber(comic.price, 0);

    const bought = await client.query(
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

    if (bought.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Bạn đã mua truyện này rồi" });
    }

    const walletRes = await client.query(
      `
      SELECT balance
      FROM wallets
      WHERE user_id = $1
      FOR UPDATE
      `,
      [userId]
    );

    if (!walletRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Bạn chưa có ví hoặc chưa thể thanh toán. Hãy nạp tiền trước.",
      });
    }

    const balance = toNumber(walletRes.rows[0].balance, 0);

    if (balance < price) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `Số dư không đủ. Cần ${price} nhưng bạn có ${balance}`,
        balance,
        price,
      });
    }

    const newBalance = balance - price;

    await client.query(
      `
      UPDATE wallets
      SET balance = $1, updated_at = NOW()
      WHERE user_id = $2
      `,
      [newBalance, userId]
    );

    await client.query(
      `
      INSERT INTO wallet_transactions (user_id, type, amount, note, status)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        userId,
        "purchase",
        -price,
        `Mua truyện external: ${comic.name} (${comic.slug})`,
        "success",
      ]
    );

    await client.query(
      `
      INSERT INTO comic_purchases (
        user_id,
        comic_type,
        external_comic_id,
        comic_slug,
        comic_api_id,
        price
      )
      VALUES ($1, 'external', $2, $3, $4, $5)
      `,
      [userId, comic.id, comic.slug, comic.api_id, price]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Mua truyện thành công",
      data: {
        comic_type: "external",
        external_comic_id: comic.id,
        slug: comic.slug,
        price,
        balance: newBalance,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("buy external comic error:", err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

// ======================================================
// CHECK ACCESS EXTERNAL COMIC
// GET /api/purchases/access/:slug
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

    if (!comic.is_paid || toNumber(comic.price, 0) <= 0) {
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
// BUY SELF COMIC
// POST /api/purchases/buy-self/:id
// ======================================================
router.post("/buy-self/:id", auth, async (req, res) => {
  const userId = req.user.id;
  const comicId = toInt(req.params.id, 0);

  if (!comicId) {
    return res.status(400).json({ message: "ID truyện không hợp lệ" });
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const comicRes = await client.query(
      `
      SELECT
        id,
        user_id,
        title,
        is_paid,
        price,
        status
      FROM self_comics
      WHERE id = $1
      LIMIT 1
      `,
      [comicId]
    );

    if (!comicRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Không tìm thấy truyện tự đăng" });
    }

    const comic = comicRes.rows[0];

    if (!comic.is_paid || toNumber(comic.price, 0) <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Truyện này miễn phí, không cần mua" });
    }

    if (Number(comic.user_id) === Number(userId)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Bạn không cần mua truyện của chính mình" });
    }

    const price = toNumber(comic.price, 0);

    const bought = await client.query(
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

    if (bought.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Bạn đã mua truyện này rồi" });
    }

    const walletRes = await client.query(
      `
      SELECT balance
      FROM wallets
      WHERE user_id = $1
      FOR UPDATE
      `,
      [userId]
    );

    if (!walletRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Bạn chưa có ví hoặc chưa thể thanh toán. Hãy nạp tiền trước.",
      });
    }

    const balance = toNumber(walletRes.rows[0].balance, 0);

    if (balance < price) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `Số dư không đủ. Cần ${price} nhưng bạn có ${balance}`,
        balance,
        price,
      });
    }

    const newBalance = balance - price;

    await client.query(
      `
      UPDATE wallets
      SET balance = $1, updated_at = NOW()
      WHERE user_id = $2
      `,
      [newBalance, userId]
    );

    await client.query(
      `
      INSERT INTO wallet_transactions (user_id, type, amount, note, status)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        userId,
        "purchase",
        -price,
        `Mua truyện tự đăng: ${comic.title} (#${comic.id})`,
        "success",
      ]
    );

    await client.query(
      `
      INSERT INTO comic_purchases (
        user_id,
        comic_type,
        self_comic_id,
        price
      )
      VALUES ($1, 'self', $2, $3)
      `,
      [userId, comic.id, price]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Mua truyện tự đăng thành công",
      data: {
        comic_type: "self",
        self_comic_id: comic.id,
        price,
        balance: newBalance,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("buy self comic error:", err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

// ======================================================
// CHECK ACCESS SELF COMIC
// GET /api/purchases/access-self/:id
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

    if (Number(comic.user_id) === Number(userId)) {
      return res.json({
        success: true,
        hasAccess: true,
        reason: "owner",
      });
    }

    if (!comic.is_paid || toNumber(comic.price, 0) <= 0) {
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