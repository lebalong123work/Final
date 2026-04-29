const SelfChapterModel = require("../../models/comics/selfChapter.model");

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** GET /api/self-chapters/comic/:comicId — List of chapters for a comic */
async function getByComic(req, res) {
  try {
    const comicId = toInt(req.params.comicId, 0);

    if (!comicId) return res.status(400).json({ message: "Invalid comicId" });

    const rows = await SelfChapterModel.getByComic(comicId);
    res.json({ data: rows });
  } catch (err) {
    console.error("GET chapters error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

/** GET /api/self-chapters/:id — Detail of a chapter (including HTML content) */
async function getById(req, res) {
  try {
    const id = toInt(req.params.id, 0);

    if (!id) return res.status(400).json({ message: "Invalid ID" });

    const row = await SelfChapterModel.getById(id);
    if (!row) return res.status(404).json({ message: "Chapter not found" });

    res.json({ data: row });
  } catch (err) {
    console.error("GET chapter error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

/** POST /api/self-chapters — Create a new chapter (upload base64 images → Cloudinary) */
async function create(req, res) {
  try {
    const comicId     = toInt(req.body.comic_id, 0);
    const chapterNo   = toInt(req.body.chapter_no, 1);
    const chapterTitle = String(req.body.chapter_title || "").trim();
    const rawContent  = String(req.body.content || "").trim();

    if (!comicId)      return res.status(400).json({ message: "Invalid comicId" });
    if (!chapterTitle) return res.status(400).json({ message: "Missing chapter title" });
    if (!rawContent)   return res.status(400).json({ message: "Missing chapter content" });

    const row = await SelfChapterModel.create({ comicId, chapterNo, chapterTitle, rawContent });
    res.status(201).json({ message: "Chapter created successfully", data: row });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "Chapter already exists" });
    }
    console.error("CREATE chapter error:", err);
    res.status(500).json({ message: "Server error when creating chapter" });
  }
}

/** PATCH /api/self-chapters/:id — Update chapter title and content */
async function update(req, res) {
  try {
    const id = toInt(req.params.id, 0);

    if (!id) return res.status(400).json({ message: "Invalid ID" });

    const chapterTitle = String(req.body.chapter_title || "").trim();
    const rawContent   = String(req.body.content || "").trim();

    if (!chapterTitle) return res.status(400).json({ message: "Chapter title cannot be empty" });
    if (!rawContent)   return res.status(400).json({ message: "Chapter content cannot be empty" });

    const row = await SelfChapterModel.update(id, { chapterTitle, rawContent });
    if (!row) return res.status(404).json({ message: "Chapter not found" });

    res.json({ message: "Chapter updated successfully", data: row });
  } catch (err) {
    console.error("UPDATE chapter error:", err);
    res.status(500).json({ message: "Server error when updating chapter" });
  }
}

/** DELETE /api/self-chapters/:id — Delete chapter */
async function remove(req, res) {
  try {
    const id = toInt(req.params.id, 0);

    if (!id) return res.status(400).json({ message: "Invalid ID" });

    const row = await SelfChapterModel.remove(id);
    if (!row) return res.status(404).json({ message: "Chapter not found" });

    res.json({ message: "Chapter deleted successfully", data: row });
  } catch (err) {
    console.error("DELETE chapter error:", err);
    res.status(500).json({ message: "Server error when deleting chapter" });
  }
}

module.exports = { getByComic, getById, create, update, remove };
