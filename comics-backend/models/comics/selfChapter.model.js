const db = require("../../db");
const cloudinary = require("../../utils/cloudinary");

/* ─── Cloudinary helpers ─── */

function isBase64Image(v) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(String(v || "").trim());
}

async function uploadBase64ImageToCloudinary(base64, folder = "self-comics/chapters") {
  const result = await cloudinary.uploader.upload(base64, {
    folder,
    resource_type: "image",
  });
  return result.secure_url;
}

/**
* Iterate through the entire HTML, find the <img> tag with src set to base64,
* Upload each image to Cloudinary and replace src with the Cloudinary URL.
* Keep all images as HTTP URLs.
*/
async function replaceBase64ImagesInHtml(html) {
  const raw = String(html || "");
  if (!raw) return raw;

  const matches = [...raw.matchAll(/<img[^>]+src=["'](data:image\/[^"']+)["'][^>]*>/gi)];
  if (!matches.length) return raw;

  let nextHtml = raw;

  for (const match of matches) {
    const fullMatch = match[0];
    const base64Src = match[1];

    if (!isBase64Image(base64Src)) continue;

    const uploadedUrl = await uploadBase64ImageToCloudinary(base64Src, "self-comics/chapters");
    const replacedTag = fullMatch.replace(base64Src, uploadedUrl);
    nextHtml = nextHtml.replace(fullMatch, replacedTag);
  }

  return nextHtml;
}

/* ─── Queries ─── */

/** Get the list of chapters for a comic (excluding content). */
async function getByComic(comicId) {
  const result = await db.query(
    `SELECT id, comic_id, chapter_no, chapter_title, created_at
     FROM self_comic_chapters
     WHERE comic_id = $1
     ORDER BY chapter_no ASC`,
    [comicId]
  );
  return result.rows;
}

/** Get the details of a specific chapter (including HTML content). Returns null if not found. */
async function getById(id) {
  const result = await db.query(
    `SELECT * FROM self_comic_chapters WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Create a new chapter.
 * Base64 images in the HTML are uploaded to Cloudinary before INSERT.
 */
async function create({ comicId, chapterNo, chapterTitle, rawContent }) {
  const content = await replaceBase64ImagesInHtml(rawContent);

  const insert = await db.query(
    `INSERT INTO self_comic_chapters (comic_id, chapter_no, chapter_title, content)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [comicId, chapterNo, chapterTitle, content]
  );

  return insert.rows[0];
}

/**
 * Update the title and content of a chapter.
 * New base64 images in the HTML are uploaded to Cloudinary.
 * Returns null if the chapter is not found.
 */
async function update(id, { chapterTitle, rawContent }) {
  const content = await replaceBase64ImagesInHtml(rawContent);

  const result = await db.query(
    `UPDATE self_comic_chapters
     SET chapter_title = $1, content = $2
     WHERE id = $3
     RETURNING *`,
    [chapterTitle, content, id]
  );

  return result.rows[0] || null;
}

/** Delete a chapter. Returns { id, chapter_title } if successful, null if not found. */
async function remove(id) {
  const result = await db.query(
    `DELETE FROM self_comic_chapters WHERE id = $1 RETURNING id, chapter_title`,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { getByComic, getById, create, update, remove };
