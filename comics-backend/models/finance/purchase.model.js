const db = require("../../db");

// ── Access checks ────────────────────────────────────────────────────────────

async function checkAccessExternal(userId, slug) {
  const comicRes = await db.query(
    `SELECT id, is_paid, price FROM external_comics WHERE slug=$1 LIMIT 1`,
    [slug]
  );
  if (!comicRes.rows.length) return null;
  const comic = comicRes.rows[0];

  if (!comic.is_paid || Number(comic.price || 0) <= 0) return { hasAccess: true, reason: "free" };

  const bought = await db.query(
    `SELECT 1 FROM comic_purchases WHERE user_id=$1 AND comic_type='external' AND external_comic_id=$2 LIMIT 1`,
    [userId, comic.id]
  );
  return { hasAccess: !!bought.rows.length, reason: bought.rows.length ? "purchased" : "locked" };
}

async function checkAccessSelf(userId, comicId) {
  const comicRes = await db.query(
    `SELECT id, user_id, is_paid, price FROM self_comics WHERE id=$1 LIMIT 1`,
    [comicId]
  );
  if (!comicRes.rows.length) return null;
  const comic = comicRes.rows[0];

  if (Number(comic.user_id) === Number(userId)) return { hasAccess: true, reason: "owner" };
  if (!comic.is_paid || Number(comic.price || 0) <= 0) return { hasAccess: true, reason: "free" };

  const bought = await db.query(
    `SELECT 1 FROM comic_purchases WHERE user_id=$1 AND comic_type='self' AND self_comic_id=$2 LIMIT 1`,
    [userId, comic.id]
  );
  return { hasAccess: !!bought.rows.length, reason: bought.rows.length ? "purchased" : "locked" };
}

// ── Buy operations (DB transaction) ─────────────────────────────────────────

async function buyExternal(userId, slug) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const comicRes = await client.query(
      `SELECT id, api_id, slug, name, is_paid, price FROM external_comics WHERE slug=$1 LIMIT 1`,
      [slug]
    );
    if (!comicRes.rows.length) { await client.query("ROLLBACK"); return { error: 404, message: "Không tìm thấy truyện trong DB" }; }
    const comic = comicRes.rows[0];
    const price = Number(comic.price || 0);

    if (!comic.is_paid || price <= 0) { await client.query("ROLLBACK"); return { error: 400, message: "Truyện này miễn phí, không cần mua" }; }

    const bought = await client.query(
      `SELECT 1 FROM comic_purchases WHERE user_id=$1 AND comic_type='external' AND external_comic_id=$2 LIMIT 1`,
      [userId, comic.id]
    );
    if (bought.rows.length) { await client.query("ROLLBACK"); return { error: 409, message: "Bạn đã mua truyện này rồi" }; }

    const walletRes = await client.query(`SELECT balance FROM wallets WHERE user_id=$1 FOR UPDATE`, [userId]);
    if (!walletRes.rows.length) { await client.query("ROLLBACK"); return { error: 400, message: "Bạn chưa có ví hoặc chưa thể thanh toán. Hãy nạp tiền trước." }; }
    const balance = Number(walletRes.rows[0].balance || 0);
    if (balance < price) { await client.query("ROLLBACK"); return { error: 400, message: `Insufficient balance. Needed ${price} but you have ${balance}`, balance, price }; }

    const newBalance = balance - price;
    await client.query(`UPDATE wallets SET balance=$1, updated_at=NOW() WHERE user_id=$2`, [newBalance, userId]);
    await client.query(
      `INSERT INTO wallet_transactions (user_id,type,amount,note,status) VALUES ($1,'purchase',$2,$3,'success')`,
      [userId, -price, `Mua truyện external: ${comic.name} (${comic.slug})`]
    );
    await client.query(
      `INSERT INTO comic_purchases (user_id,comic_type,external_comic_id,comic_slug,comic_api_id,price) VALUES ($1,'external',$2,$3,$4,$5)`,
      [userId, comic.id, comic.slug, comic.api_id, price]
    );

    await client.query("COMMIT");
    return { success: true, data: { comic_type: "external", external_comic_id: comic.id, slug: comic.slug, price, balance: newBalance } };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function buySelf(userId, comicId) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const comicRes = await client.query(
      `SELECT id, user_id, title, is_paid, price, status FROM self_comics WHERE id=$1 LIMIT 1`,
      [comicId]
    );
    if (!comicRes.rows.length) { await client.query("ROLLBACK"); return { error: 404, message: "Không tìm thấy truyện tự đăng" }; }
    const comic = comicRes.rows[0];
    const price = Number(comic.price || 0);

    if (!comic.is_paid || price <= 0) { await client.query("ROLLBACK"); return { error: 400, message: "Truyện này miễn phí, không cần mua" }; }
    if (Number(comic.user_id) === Number(userId)) { await client.query("ROLLBACK"); return { error: 400, message: "Bạn không cần mua truyện của chính mình" }; }

    const bought = await client.query(
      `SELECT 1 FROM comic_purchases WHERE user_id=$1 AND comic_type='self' AND self_comic_id=$2 LIMIT 1`,
      [userId, comic.id]
    );
    if (bought.rows.length) { await client.query("ROLLBACK"); return { error: 409, message: "Bạn đã mua truyện này rồi" }; }

    const walletRes = await client.query(`SELECT balance FROM wallets WHERE user_id=$1 FOR UPDATE`, [userId]);
    if (!walletRes.rows.length) { await client.query("ROLLBACK"); return { error: 400, message: "Bạn chưa có ví hoặc chưa thể thanh toán. Hãy nạp tiền trước." }; }
    const balance = Number(walletRes.rows[0].balance || 0);
    if (balance < price) { await client.query("ROLLBACK"); return { error: 400, message: `Insufficient balance. Needed ${price} but you have ${balance}`, balance, price }; }

    const newBalance = balance - price;
    await client.query(`UPDATE wallets SET balance=$1, updated_at=NOW() WHERE user_id=$2`, [newBalance, userId]);
    await client.query(
      `INSERT INTO wallet_transactions (user_id,type,amount,note,status) VALUES ($1,'purchase',$2,$3,'success')`,
      [userId, -price, `Mua truyện tự đăng: ${comic.title} (#${comic.id})`]
    );
    await client.query(
      `INSERT INTO comic_purchases (user_id,comic_type,self_comic_id,price) VALUES ($1,'self',$2,$3)`,
      [userId, comic.id, price]
    );

    await client.query("COMMIT");
    return { success: true, data: { comic_type: "self", self_comic_id: comic.id, price, balance: newBalance } };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { checkAccessExternal, checkAccessSelf, buyExternal, buySelf };
