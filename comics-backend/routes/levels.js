const express = require("express");
const router = express.Router();

const db = require("../db"); 

const { auth, requireAdmin } = require("../middleware/auth");


function isIntLike(n) {
  return Number.isInteger(Number(n));
}

// GET /levels?keyword=&page=1&limit=20
router.get("/", async (req, res) => {
  try {
    const { keyword = "", page = 1, limit = 20 } = req.query;

    const _page = Math.max(1, Number(page) || 1);
    const _limit = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (_page - 1) * _limit;

    const kw = `%${String(keyword).trim()}%`;

    const totalRs = await db.query(
      `
      SELECT COUNT(*)::int AS total
      FROM levels
      WHERE name ILIKE $1 OR level_no::text ILIKE $1
      `,
      [kw]
    );

    const rs = await db.query(
      `
      SELECT id, level_no, min_total_topup, name, created_at
      FROM levels
      WHERE name ILIKE $1 OR level_no::text ILIKE $1
      ORDER BY level_no ASC
      LIMIT $2 OFFSET $3
      `,
      [kw, _limit, offset]
    );

    return res.json({
      data: rs.rows,
      paging: { page: _page, limit: _limit, total: totalRs.rows[0].total },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// GET /levels/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!isIntLike(id)) return res.status(400).json({ message: "id không hợp lệ" });

    const rs = await db.query(
      `SELECT id, level_no, min_total_topup, name, created_at FROM levels WHERE id=$1`,
      [id]
    );
    if (rs.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy level" });

    return res.json({ data: rs.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// POST /levels  (admin)
router.post("/", auth, requireAdmin, async (req, res) => {
  try {
    const { level_no, min_total_topup = 0, name } = req.body || {};

    if (!isIntLike(level_no)) return res.status(400).json({ message: "level_no phải là số nguyên" });
    if (name == null || String(name).trim() === "")
      return res.status(400).json({ message: "Thiếu name" });

    const minTopup = BigInt(min_total_topup ?? 0);
    if (minTopup < 0n) return res.status(400).json({ message: "min_total_topup phải >= 0" });

    const rs = await db.query(
      `
      INSERT INTO levels (level_no, min_total_topup, name)
      VALUES ($1, $2, $3)
      RETURNING id, level_no, min_total_topup, name, created_at
      `,
      [Number(level_no), minTopup.toString(), String(name).trim()]
    );

    return res.status(201).json({ message: "Tạo level thành công", data: rs.rows[0] });
  } catch (err) {
    // duplicate key unique (level_no)
    if (err.code === "23505") {
      return res.status(409).json({ message: "level_no đã tồn tại" });
    }
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// PUT /levels/:id  (admin) - sửa level
router.put("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!isIntLike(id)) return res.status(400).json({ message: "id không hợp lệ" });

    const { level_no, min_total_topup, name } = req.body || {};

    // Cho phép update từng field (patch-like)
    const current = await db.query(`SELECT * FROM levels WHERE id=$1`, [id]);
    if (current.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy level" });

    const newLevelNo = level_no === undefined ? current.rows[0].level_no : Number(level_no);
    if (level_no !== undefined && !isIntLike(newLevelNo))
      return res.status(400).json({ message: "level_no phải là số nguyên" });

    const newName = name === undefined ? current.rows[0].name : String(name).trim();
    if (name !== undefined && newName === "")
      return res.status(400).json({ message: "name không được rỗng" });

    const newMinTopup =
      min_total_topup === undefined
        ? BigInt(current.rows[0].min_total_topup)
        : BigInt(min_total_topup);

    if (newMinTopup < 0n) return res.status(400).json({ message: "min_total_topup phải >= 0" });

    const rs = await db.query(
      `
      UPDATE levels
      SET level_no=$1, min_total_topup=$2, name=$3
      WHERE id=$4
      RETURNING id, level_no, min_total_topup, name, created_at
      `,
      [newLevelNo, newMinTopup.toString(), newName, id]
    );

    return res.json({ message: "Cập nhật level thành công", data: rs.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "level_no đã tồn tại" });
    }
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// DELETE /levels/:id  (admin)
router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!isIntLike(id)) return res.status(400).json({ message: "id không hợp lệ" });

    const rs = await db.query(`DELETE FROM levels WHERE id=$1 RETURNING id`, [id]);
    if (rs.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy level" });

    return res.json({ message: "Xoá level thành công" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;