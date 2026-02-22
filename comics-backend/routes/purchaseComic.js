const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth } = require("../middleware/auth");

// POST /api/purchases/buy/:slug
router.post("/buy/:slug", auth, async (req, res) => {
  const userId = req.user.id;
  const { slug } = req.params;

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // 1) lấy thông tin truyện + khóa row truyện (optional)
    const comicRes = await client.query(
      `SELECT api_id, slug, name, is_paid, price
       FROM external_comics
       WHERE slug = $1
       LIMIT 1`,
      [slug]
    );

    if (!comicRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Không tìm thấy truyện trong DB" });
    }

    const comic = comicRes.rows[0];

   
    if (!comic.is_paid || Number(comic.price || 0) <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Truyện này miễn phí, không cần mua" });
    }

    const price = Number(comic.price);

 
    const bought = await client.query(
      `SELECT 1 FROM comic_purchases WHERE user_id=$1 AND comic_slug=$2 LIMIT 1`,
      [userId, slug]
    );
    if (bought.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Bạn đã mua truyện này rồi" });
    }


    const walletRes = await client.query(
      `SELECT balance FROM wallets WHERE user_id=$1 FOR UPDATE`,
      [userId]
    );

    if (!walletRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Tiền bạn không đủ mua truyện. Hãy nạp tiền trước." });
    }

    const balance = Number(walletRes.rows[0].balance || 0);
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
      `UPDATE wallets SET balance=$1, updated_at=NOW() WHERE user_id=$2`,
      [newBalance, userId]
    );

 
    await client.query(
      `INSERT INTO wallet_transactions (user_id, type, amount, note, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        "purchase",
        - price,
        `Mua truyện: ${comic.name} (${comic.slug})`,
        "success",
      ]
    );

   
    await client.query(
      `INSERT INTO comic_purchases (user_id, comic_api_id, comic_slug, price)
       VALUES ($1, $2, $3, $4)`,
      [userId, comic.api_id, comic.slug, price]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Mua truyện thành công",
      data: { slug, price, balance: newBalance },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("buy comic error:", err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

module.exports = router;