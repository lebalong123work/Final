const CategoryModel = require("../../models/comics/category.model");

function normalizeText(v) { return String(v || "").trim().replace(/\s+/g, " "); }

async function list(req, res) {
  try {
    const data = await CategoryModel.list();
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET categories error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getById(req, res) {
  try {
    const data = await CategoryModel.getById(req.params.id);
    if (!data) return res.status(404).json({ message: "Category not found" });
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET category error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function ensure(req, res) {
  try {
    const name = normalizeText(req.body.name);
    if (!name) return res.status(400).json({ message: "Missing category name" });

    const existed = await CategoryModel.findByName(name);
    if (existed) return res.json({ success: true, message: "Category already exists", data: existed });

    const data = await CategoryModel.create(name);
    return res.status(201).json({ success: true, message: "New category created", data });
  } catch (err) {
    console.error("ENSURE category error:", err);
    if (err.code === "23505") {
      try {
        const retry = await CategoryModel.findByName(normalizeText(req.body.name));
        if (retry) return res.json({ success: true, message: "Category already exists", data: retry });
      } catch (e) { console.error("ENSURE category retry error:", e); }
      return res.status(409).json({ message: "Category already exists" });
    }
    return res.status(500).json({ message: "Server error" });
  }
}

async function create(req, res) {
  try {
    const name = normalizeText(req.body.name);
    if (!name) return res.status(400).json({ message: "Missing category name" });
    const data = await CategoryModel.create(name);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("CREATE category error:", err);
    if (err.code === "23505") return res.status(409).json({ message: "Category already exists" });
    return res.status(500).json({ message: "Server error" });
  }
}

async function update(req, res) {
  try {
    const name = normalizeText(req.body.name);
    if (!name) return res.status(400).json({ message: "Missing category name" });
    const data = await CategoryModel.update(req.params.id, name);
    if (!data) return res.status(404).json({ message: "Category not found" });
    return res.json({ success: true, data });
  } catch (err) {
    console.error("UPDATE category error:", err);
    if (err.code === "23505") return res.status(409).json({ message: "Category already exists" });
    return res.status(500).json({ message: "Server error" });
  }
}

async function remove(req, res) {
  try {
    const data = await CategoryModel.remove(req.params.id);
    if (!data) return res.status(404).json({ message: "Category not found" });
    return res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    console.error("DELETE category error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { list, getById, ensure, create, update, remove };
