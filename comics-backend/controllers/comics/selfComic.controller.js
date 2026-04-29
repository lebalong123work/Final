const SelfComicModel = require("../../models/comics/selfComic.model");

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeText(v) {
  return String(v || "").trim();
}

/** GET /api/self-comics — List of self-published comics with pagination and search */
async function list(req, res) {
  try {
    const page       = Math.max(1, Number(req.query.page  || 1));
    const limit      = Math.min(100, Math.max(1, Number(req.query.limit || 12)));
    const q          = normalizeText(req.query.q);
    const categoryId = toInt(req.query.categoryId, 0);

    const result = await SelfComicModel.list({ page, limit, q, categoryId });
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error when loading list" });
  }
}

/** GET /api/self-comics/:id — Detail of a self-published comic */
async function getById(req, res) {
  try {
    const id  = toInt(req.params.id, 0);
    const row = await SelfComicModel.getById(id);

    if (!row) return res.status(404).json({ message: "Comic not found" });

    res.json({ data: row });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error when loading detail" });
  }
}

/** POST /api/self-comics — Create a new self-published comic (with cover image upload to Cloudinary) */
async function create(req, res) {
  try {
    const userId      = req.user.id;
    const title       = normalizeText(req.body.title);
    const author      = normalizeText(req.body.author) || null;
    const translatedBy = normalizeText(req.body.translated_by) || null;
    const rawCover    = req.body.cover_image;
    const desc        = normalizeText(req.body.description);
    const totalChapters = Math.max(1, Number(req.body.total_chapters || 1));
    const status      = Number(req.body.status ?? 1);
    const isPaid      = !!req.body.is_paid;
    const price       = isPaid ? Math.max(0, Number(req.body.price || 0)) : 0;
    const categoryIds = Array.isArray(req.body.category_ids) ? req.body.category_ids : [];

    if (!title)    return res.status(400).json({ message: "Missing title" });
    if (!rawCover) return res.status(400).json({ message: "Missing cover image" });

    const comic = await SelfComicModel.create({
      userId, title, author, translatedBy, rawCover, desc,
      totalChapters, status, isPaid, price, categoryIds,
    });

    res.json({ data: comic });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error when creating comic" });
  }
}

/** PATCH /api/self-comics/:id — Update comic (partial update) */
async function update(req, res) {
  try {
    const id  = toInt(req.params.id, 0);

    const row = await SelfComicModel.update(id, {
      title:         req.body.title,
      author:        req.body.author,
      translatedBy:  req.body.translated_by,
      rawCover:      req.body.cover_image,
      desc:          req.body.description,
      totalChapters: req.body.total_chapters,
      status:        req.body.status,
      isPaid:        req.body.is_paid,
      price:         req.body.price,
      categoryIds:   req.body.category_ids,
    });

    if (!row) return res.status(404).json({ message: "Comic not found" });

    res.json({ data: row });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error when updating comic" });
  }
}

/** DELETE /api/self-comics/:id — Delete comic */
async function remove(req, res) {
  try {
    const id = toInt(req.params.id, 0);
    await SelfComicModel.remove(id);
    res.json({ message: "Comic deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error when deleting comic" });
  }
}

module.exports = { list, getById, create, update, remove };
