const express = require("express");
const db = require("../db");
const { auth } = require("../middleware/auth");
const cloudinary = require("../utils/cloudinary");

const router = express.Router();

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

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

async function replaceBase64ImagesInHtml(html) {
  const raw = String(html || "");
  if (!raw) return raw;

  const matches = [...raw.matchAll(/<img[^>]+src=["'](data:image\/[^"']+)["'][^>]*>/gi)];

  if (!matches.length) {
    return raw;
  }

  let nextHtml = raw;

  for (const match of matches) {
    const fullMatch = match[0];
    const base64Src = match[1];

    if (!isBase64Image(base64Src)) continue;

    const uploadedUrl = await uploadBase64ImageToCloudinary(
      base64Src,
      "self-comics/chapters"
    );

    const replacedTag = fullMatch.replace(base64Src, uploadedUrl);
    nextHtml = nextHtml.replace(fullMatch, replacedTag);
  }

  return nextHtml;
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

    if (!id) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

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
    const rawContent = String(req.body.content || "").trim();

    if (!comicId) {
      return res.status(400).json({ message: "comic_id không hợp lệ" });
    }

    if (!chapterTitle) {
      return res.status(400).json({ message: "Thiếu tiêu đề chương" });
    }

    if (!rawContent) {
      return res.status(400).json({ message: "Thiếu nội dung chương" });
    }

    const content = await replaceBase64ImagesInHtml(rawContent);

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

    if (!id) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const chapterTitle = String(req.body.chapter_title || "").trim();
    const rawContent = String(req.body.content || "").trim();

    if (!chapterTitle) {
      return res.status(400).json({ message: "Tiêu đề chương không được trống" });
    }

    if (!rawContent) {
      return res.status(400).json({ message: "Nội dung chương không được trống" });
    }

    const content = await replaceBase64ImagesInHtml(rawContent);

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

    if (!id) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

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