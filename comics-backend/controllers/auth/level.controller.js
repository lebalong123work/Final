const LevelModel = require("../../models/auth/level.model");

function isIntLike(n) { return Number.isInteger(Number(n)); }

async function getMeProgress(req, res) {
  try {
    const data = await LevelModel.getMeProgress(Number(req.user.id));
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/levels/me-progress error:", err);
    return res.status(500).json({ message: "Server error when fetching level progress" });
  }
}

async function list(req, res) {
  try {
    const { keyword = "", page = 1, limit = 20 } = req.query;
    const _page = Math.max(1, Number(page) || 1);
    const _limit = Math.min(100, Math.max(1, Number(limit) || 20));
    const { rows, total } = await LevelModel.list(keyword, _page, _limit);
    return res.json({ data: rows, paging: { page: _page, limit: _limit, total } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!isIntLike(id)) return res.status(400).json({ message: "id is invalid" });
    const data = await LevelModel.getById(id);
    if (!data) return res.status(404).json({ message: "Level not found" });
    return res.json({ data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function create(req, res) {
  try {
    const { level_no, min_total_topup = 0, name } = req.body || {};
    if (!isIntLike(level_no)) return res.status(400).json({ message: "level_no is invalid" });
    if (name == null || String(name).trim() === "") return res.status(400).json({ message: "Name is required" });
    const minTopup = BigInt(min_total_topup ?? 0);
    if (minTopup < 0n) return res.status(400).json({ message: "min_total_topup must be a non-negative number" });
    const data = await LevelModel.create(level_no, minTopup, name);
    return res.status(201).json({ message: "Level created successfully", data });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "level_no already exists" });
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function update(req, res) {
  try {
    const id = Number(req.params.id);
    if (!isIntLike(id)) return res.status(400).json({ message: "id is invalid" });
    const current = await LevelModel.getById(id);
    if (!current) return res.status(404).json({ message: "Level not found" });

    const { level_no, min_total_topup, name } = req.body || {};
    const newLevelNo = level_no === undefined ? current.level_no : Number(level_no);
    if (level_no !== undefined && !isIntLike(newLevelNo)) return res.status(400).json({ message: "level_no is invalid" });
    const newName = name === undefined ? current.name : String(name).trim();
    if (name !== undefined && newName === "") return res.status(400).json({ message: "Name cannot be empty." });
    const newMinTopup = min_total_topup === undefined ? BigInt(current.min_total_topup) : BigInt(min_total_topup);
    if (newMinTopup < 0n) return res.status(400).json({ message: "min_total_topup must be a non-negative number" });

    const data = await LevelModel.update(id, newLevelNo, newMinTopup, newName);
    return res.json({ message: "Level updated successfully", data });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "level_no already exists" });
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    if (!isIntLike(id)) return res.status(400).json({ message: "id is invalid" });
    const data = await LevelModel.remove(id);
    if (!data) return res.status(404).json({ message: "Level not found" });
    return res.json({ message: "Level removed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getMeProgress, list, getById, create, update, remove };
