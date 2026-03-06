const express = require("express");
const db = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * GET chapters of comic
 * /api/self-chapters/comic/:comicId
 */
router.get("/comic/:comicId", async (req, res) => {
  try {
    const comicId = toInt(req.params.comicId, 0);

    if (!comicId) {
      return res.status(400).json({ message: "comicId không hợp lệ" });
    }

    const result = await db.query(
      `
      SELECT
        id,
        comic_id,
        chapter_no,
        chapter_title,
        created_at
      FROM self_comic_chapters
      WHERE comic_id = $1
      ORDER BY chapter_no ASC
      `,
      [comicId]
    );

    res.json({
      data: result.rows,
    });
  } catch (err) {
    console.error("GET chapters error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * GET chapter detail
 */
router.get("/:id", async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);

    const result = await db.query(
      `
      SELECT *
      FROM self_comic_chapters
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Không tìm thấy chương" });
    }

    res.json({
      data: result.rows[0],
    });
  } catch (err) {
    console.error("GET chapter error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * POST create chapter
 */
router.post("/", auth, async (req, res) => {
  try {
    const comicId = toInt(req.body.comic_id, 0);
    const chapterNo = toInt(req.body.chapter_no, 1);
    const chapterTitle = String(req.body.chapter_title || "").trim();
    const content = String(req.body.content || "").trim();

    if (!comicId) {
      return res.status(400).json({ message: "comic_id không hợp lệ" });
    }

    if (!chapterTitle) {
      return res.status(400).json({ message: "Thiếu tiêu đề chương" });
    }

    if (!content) {
      return res.status(400).json({ message: "Thiếu nội dung chương" });
    }

    const insert = await db.query(
      `
      INSERT INTO self_comic_chapters
      (comic_id, chapter_no, chapter_title, content)
      VALUES ($1,$2,$3,$4)
      RETURNING *
      `,
      [comicId, chapterNo, chapterTitle, content]
    );

    res.status(201).json({
      message: "Thêm chương thành công",
      data: insert.rows[0],
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        message: "Chương này đã tồn tại",
      });
    }

    console.error("CREATE chapter error:", err);
    res.status(500).json({ message: "Lỗi server khi tạo chương" });
  }
});

/**
 * PATCH update chapter
 */
router.patch("/:id", auth, async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);

    const chapterTitle = String(req.body.chapter_title || "").trim();
    const content = String(req.body.content || "").trim();

    if (!chapterTitle) {
      return res.status(400).json({ message: "Tiêu đề chương không được trống" });
    }

    if (!content) {
      return res.status(400).json({ message: "Nội dung chương không được trống" });
    }

    const result = await db.query(
      `
      UPDATE self_comic_chapters
      SET
        chapter_title = $1,
        content = $2
      WHERE id = $3
      RETURNING *
      `,
      [chapterTitle, content, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Không tìm thấy chương" });
    }

    res.json({
      message: "Cập nhật chương thành công",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("UPDATE chapter error:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật chương" });
  }
});

/**
 * DELETE chapter
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);

    const result = await db.query(
      `
      DELETE FROM self_comic_chapters
      WHERE id = $1
      RETURNING id, chapter_title
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Không tìm thấy chương" });
    }

    res.json({
      message: "Xóa chương thành công",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("DELETE chapter error:", err);
    res.status(500).json({ message: "Lỗi server khi xoá chương" });
  }
});

module.exports = router;