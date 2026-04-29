const db = require("../../db");

const API_LIST = "https://otruyenapi.com/v1/api/danh-sach/truyen-moi";

/* ─── Helpers ─── */

function originNameToText(origin_name) {
  if (Array.isArray(origin_name)) return origin_name.join(" | ");
  return origin_name || null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
* Fetch JSON from URL with automatic retry.
* After each failure, pause delayMs before retrying.
* If all retries are exhausted, throw the last error.
*/
async function fetchJsonWithRetry(url, { retries = 3, delayMs = 1500, timeoutMs = 10000 } = {}) {
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      });

      clearTimeout(timer);

      if (!res.ok) throw new Error(`HTTP ${res.status} when fetching ${url}`);

      const json = await res.json().catch(() => ({}));
      return json;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      console.error(`Fetch fail [${attempt}/${retries}] ${url}:`, err?.message || err);
      if (attempt < retries) await sleep(delayMs);
    }
  }

  throw lastError;
}

/* ─── Queries ─── */

/**
 * Synchronize stories from otruyenapi.com to the database.
 * Run within a single DB transaction covering the entire page loop.
 *
 * @param {number|null} ownerUserId  - ID of the user performing the sync
 * @param {number}      maxPages     - Maximum number of pages to fetch
 * @param {object}      io           - Socket.IO instance (for sending notifications if notifyFollowersNewComic is available)
 * @returns stats object: { syncedPages, upsertedComics, insertedNewComics, notified, upsertedCats, linked, latestSaved }
 */
async function sync(ownerUserId, maxPages, io) {
  const client = await db.connect();

  try {
    let upsertedComics = 0;
    let insertedNewComics = 0;
    let notified = 0;
    let upsertedCats = 0;
    let linked = 0;
    let latestSaved = 0;
    let syncedPages = 0;

    await client.query("BEGIN");

    for (let page = 1; page <= maxPages; page++) {
      const url = `${API_LIST}?page=${page}`;
      console.log(`SYNC external: page ${page}/${maxPages}`);

      const json = await fetchJsonWithRetry(url, {
        retries: 3,
        delayMs: 2000,
        timeoutMs: 15000,
      });

      const items = json?.data?.items || [];

      if (!Array.isArray(items) || items.length === 0) {
        console.log(`Page ${page} không có dữ liệu, dừng sync.`);
        break;
      }

      syncedPages++;

      for (const c of items) {
      // Update story — keep is_paid/price if set manually (do not update on CONFLICT)
        const comicRes = await client.query(
          `INSERT INTO external_comics
             (api_id, name, slug, origin_name, status, thumb_url, sub_docquyen, updated_at, is_paid, price, owner_user_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,0,$9)
           ON CONFLICT (api_id) DO UPDATE SET
             name          = EXCLUDED.name,
             slug          = EXCLUDED.slug,
             origin_name   = EXCLUDED.origin_name,
             status        = EXCLUDED.status,
             thumb_url     = EXCLUDED.thumb_url,
             sub_docquyen  = EXCLUDED.sub_docquyen,
             updated_at    = EXCLUDED.updated_at
           RETURNING id, slug, name, (xmax = 0) AS inserted`,
          [
            c?._id || null,
            c?.name || null,
            c?.slug || null,
            originNameToText(c?.origin_name),
            c?.status || null,
            c?.thumb_url || null,
            !!c?.sub_docquyen,
            c?.updatedAt ? new Date(c.updatedAt) : null,
            ownerUserId,
          ]
        );

        const row = comicRes.rows[0];
        const comicId = row.id;
        upsertedComics++;

        // Notify followers if this is a new comic (inserted = true)
        if (row.inserted) {
          insertedNewComics++;

          if (io?.notifyFollowersNewComic && ownerUserId && row.slug) {
            try {
              await io.notifyFollowersNewComic({
                ownerUserId,
                comicKind: "external",
                comicSlug: row.slug,
                comicName: row.name,
              });
              notified++;
            } catch (e) {
              console.error("notifyFollowersNewComic error:", e);
            }
          }
        }

        // Update genre and connection to the story
        const cats = Array.isArray(c?.category) ? c.category : [];
        for (const cat of cats) {
          const catRes = await client.query(
            `INSERT INTO external_categories (api_id, name, slug)
             VALUES ($1,$2,$3)
             ON CONFLICT (api_id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug
             RETURNING id`,
            [cat?.id || null, cat?.name || null, cat?.slug || null]
          );

          const catId = catRes.rows[0].id;
          upsertedCats++;

          await client.query(
            `INSERT INTO external_comic_categories (comic_id, category_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
            [comicId, catId]
          );
          linked++;
        }

        // Upload the latest chapter
        const latest = c?.chaptersLatest?.[0];
        if (latest?.chapter_name || latest?.chapter_api_data) {
          await client.query(
            `INSERT INTO external_latest_chapters (comic_id, chapter_name, chapter_api_data, updated_at)
             VALUES ($1,$2,$3,NOW())
             ON CONFLICT (comic_id) DO UPDATE SET
               chapter_name     = EXCLUDED.chapter_name,
               chapter_api_data = EXCLUDED.chapter_api_data,
               updated_at       = NOW()`,
            [comicId, latest?.chapter_name || null, latest?.chapter_api_data || null]
          );
          latestSaved++;
        }
      }

      // Take a break between pages to avoid connection reset
      await sleep(500);
    }

    await client.query("COMMIT");
    return { syncedPages, upsertedComics, insertedNewComics, notified, upsertedCats, linked, latestSaved };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
* Updates the price settings for external comics.
* Returns the updated row, or null if not found.
*/
async function updatePricing(apiId, isPaid, price) {
  const r = await db.query(
    `UPDATE external_comics
     SET is_paid = $1, price = $2
     WHERE api_id = $3
     RETURNING id, api_id, is_paid, price`,
    [isPaid, isPaid ? price : 0, apiId]
  );
  return r.rows[0] || null;
}

module.exports = { sync, updatePricing };
