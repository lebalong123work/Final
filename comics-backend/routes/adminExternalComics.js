const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth, requireAdmin } = require("../middleware/auth");

const API_HOME = "https://otruyenapi.com/v1/api/home";

function originNameToText(origin_name) {
  if (Array.isArray(origin_name)) return origin_name.join(" | ");
  return origin_name || null;
}


router.post("/external-comics/sync", auth, requireAdmin, async (req, res) => {
  const client = await db.connect();

  
  const io = req.app.get("io");

  try {
    const ownerUserId = req.user?.id || null;

    const r = await fetch(API_HOME);
    const json = await r.json();
    const items = json?.data?.items || [];

  
    let upsertedComics = 0;
    let insertedNewComics = 0; 
    let notified = 0;         
    let upsertedCats = 0;
    let linked = 0;
    let latestSaved = 0;

    await client.query("BEGIN");

    for (const c of items) {
    
      const comicRes = await client.query(
        `INSERT INTO external_comics
          (api_id, name, slug, origin_name, status, thumb_url, sub_docquyen, updated_at, is_paid, price, owner_user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,0,$9)
         ON CONFLICT (api_id)
         DO UPDATE SET
           name=EXCLUDED.name,
           slug=EXCLUDED.slug,
           origin_name=EXCLUDED.origin_name,
           status=EXCLUDED.status,
           thumb_url=EXCLUDED.thumb_url,
           sub_docquyen=EXCLUDED.sub_docquyen,
           updated_at=EXCLUDED.updated_at
         RETURNING id, slug, name, (xmax = 0) AS inserted`,
        [
          c._id,
          c.name,
          c.slug || null,
          originNameToText(c.origin_name),
          c.status || null,
          c.thumb_url || null,
          !!c.sub_docquyen,
          c.updatedAt ? new Date(c.updatedAt) : null,
          ownerUserId,
        ]
      );

      const row = comicRes.rows[0];
      const comicId = row.id;
      upsertedComics++;

   
      if (row.inserted) {
        insertedNewComics++;

        if (io?.notifyFollowersNewComic && ownerUserId && row.slug) {
          try {
            await io.notifyFollowersNewComic({
              ownerUserId,
              comicKind: "self",
              comicSlug: row.slug,
              comicName: row.name,
            });
            notified++;
          } catch (e) {
            console.error("notifyFollowersNewComic error:", e);
          }
        }
      }

   
      const cats = Array.isArray(c.category) ? c.category : [];
      for (const cat of cats) {
        const catRes = await client.query(
          `INSERT INTO external_categories (api_id, name, slug)
           VALUES ($1,$2,$3)
           ON CONFLICT (api_id)
           DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug
           RETURNING id`,
          [cat.id, cat.name, cat.slug || null]
        );

        const catId = catRes.rows[0].id;
        upsertedCats++;

        await client.query(
          `INSERT INTO external_comic_categories (comic_id, category_id)
           VALUES ($1,$2)
           ON CONFLICT DO NOTHING`,
          [comicId, catId]
        );
        linked++;
      }

      // 3) latest chapter (1 latest/comic)
      const latest = c?.chaptersLatest?.[0];
      if (latest?.chapter_name || latest?.chapter_api_data) {
        await client.query(
          `INSERT INTO external_latest_chapters (comic_id, chapter_name, chapter_api_data, updated_at)
           VALUES ($1,$2,$3, NOW())
           ON CONFLICT (comic_id)
           DO UPDATE SET
             chapter_name=EXCLUDED.chapter_name,
             chapter_api_data=EXCLUDED.chapter_api_data,
             updated_at=NOW()`,
          [comicId, latest.chapter_name || null, latest.chapter_api_data || null]
        );
        latestSaved++;
      }
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Sync OK",
      stats: {
        upsertedComics,
        insertedNewComics,
        notified,
        upsertedCats,
        linked,
        latestSaved,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("SYNC external error:", err);
    return res.status(500).json({ message: "Sync lỗi" });
  } finally {
    client.release();
  }
});

// PATCH /api/admin/external-comics/:apiId/pricing
router.patch("/external-comics/:apiId/pricing", auth, requireAdmin, async (req, res) => {
  try {
    const { apiId } = req.params;
    const isPaid = !!req.body.is_paid;
    const price = Math.max(0, Number(req.body.price || 0));

    if (isPaid && price <= 0) {
      return res.status(400).json({ message: "Giá phải > 0 khi bật trả phí" });
    }

    const r = await db.query(
      `UPDATE external_comics
       SET is_paid=$1, price=$2
       WHERE api_id=$3
       RETURNING id, api_id, is_paid, price`,
      [isPaid, isPaid ? price : 0, apiId]
    );

    if (!r.rows.length) return res.status(404).json({ message: "Không tìm thấy truyện" });

    return res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error("PATCH pricing error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;