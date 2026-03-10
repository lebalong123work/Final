const express = require("express");
const router = express.Router();

const db = require("../db"); 

const { auth, requireAdmin } = require("../middleware/auth");


function isIntLike(n) {
  return Number.isInteger(Number(n));
}

router.get("/me-progress", auth, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    // Tổng tiền nạp thành công
    const topupRes = await db.query(
      `
      SELECT COALESCE(SUM(amount), 0)::bigint AS total_topup
      FROM wallet_transactions
      WHERE user_id = $1
        AND status = 'success'
        AND (
          type = 'topup_momo'
          OR LOWER(note) = 'topup_momo'
        )
      `,
      [userId]
    );

    const totalTopup = Number(topupRes.rows[0]?.total_topup || 0);

    // Lấy toàn bộ level theo thứ tự tăng dần
    const levelsRes = await db.query(
      `
      SELECT id, level_no, min_total_topup, name
      FROM levels
      ORDER BY level_no ASC
      `
    );

    const levels = levelsRes.rows || [];

    if (!levels.length) {
      return res.json({
        success: true,
        data: {
          total_topup: totalTopup,
          current_level: null,
          next_level: null,
          progress_percent: 0,
          progress_current: totalTopup,
          progress_needed: 0,
        },
      });
    }

    // Level hiện tại = level cao nhất user đạt được
    let currentLevel = levels[0];
    for (const lv of levels) {
      if (totalTopup >= Number(lv.min_total_topup || 0)) {
        currentLevel = lv;
      } else {
        break;
      }
    }

    // Level kế tiếp
    const currentIndex = levels.findIndex((lv) => Number(lv.id) === Number(currentLevel.id));
    const nextLevel = currentIndex >= 0 && currentIndex < levels.length - 1
      ? levels[currentIndex + 1]
      : null;

    let progressPercent = 100;
    let progressCurrent = totalTopup;
    let progressNeeded = totalTopup;

    if (nextLevel) {
      const currentMin = Number(currentLevel.min_total_topup || 0);
      const nextMin = Number(nextLevel.min_total_topup || 0);
      const range = Math.max(1, nextMin - currentMin);
      const passed = Math.max(0, totalTopup - currentMin);

      progressPercent = Math.round((passed / range) * 100);
      progressPercent = Math.max(0, Math.min(100, progressPercent));

      progressCurrent = totalTopup;
      progressNeeded = nextMin;
    }

    return res.json({
      success: true,
      data: {
        total_topup: totalTopup,
        current_level: {
          id: currentLevel.id,
          level_no: Number(currentLevel.level_no || 0),
          min_total_topup: Number(currentLevel.min_total_topup || 0),
          name: currentLevel.name,
        },
        next_level: nextLevel
          ? {
              id: nextLevel.id,
              level_no: Number(nextLevel.level_no || 0),
              min_total_topup: Number(nextLevel.min_total_topup || 0),
              name: nextLevel.name,
            }
          : null,
        progress_percent: progressPercent,
        progress_current: progressCurrent,
        progress_needed: progressNeeded,
      },
    });
  } catch (err) {
    console.error("GET /api/levels/me-progress error:", err);
    return res.status(500).json({ message: "Lỗi server khi lấy tiến độ level" });
  }
});

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