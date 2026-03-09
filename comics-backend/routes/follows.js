const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth } = require("../middleware/auth");

// POST /api/follows/:userId/toggle
router.post("/:userId/toggle", auth, async (req, res) => {
  try {
    const followerId = Number(req.user.id);
    const followedId = Number(req.params.userId);

    if (!followedId) {
      return res.status(400).json({ message: "userId invalid" });
    }

    if (followedId === followerId) {
      return res.status(400).json({ message: "Không thể follow chính mình" });
    }

    const existed = await db.query(
      `SELECT 1 FROM user_follows WHERE follower_id = $1 AND followee_id = $2`,
      [followerId, followedId]
    );

    let following = false;

    if (existed.rowCount) {
      await db.query(
        `DELETE FROM user_follows WHERE follower_id = $1 AND followee_id = $2`,
        [followerId, followedId]
      );
      following = false;
    } else {
      await db.query(
        `
        INSERT INTO user_follows (follower_id, followee_id)
        VALUES ($1, $2)
        ON CONFLICT (follower_id, followee_id) DO NOTHING
        `,
        [followerId, followedId]
      );
      following = true;
    }

    const cnt = await db.query(
      `SELECT COUNT(*)::int AS followers FROM user_follows WHERE followee_id = $1`,
      [followedId]
    );

    return res.json({
      success: true,
      data: {
        following,
        followers: cnt.rows[0]?.followers || 0,
      },
    });
  } catch (e) {
    console.error("toggle follow error", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/follows/:userId/status
router.get("/:userId/status", auth, async (req, res) => {
  try {
    const followerId = Number(req.user.id);
    const followedId = Number(req.params.userId);

    if (!followedId) {
      return res.status(400).json({ message: "userId invalid" });
    }

    const existed = await db.query(
      `SELECT 1 FROM user_follows WHERE follower_id = $1 AND followee_id = $2`,
      [followerId, followedId]
    );

    const cnt = await db.query(
      `SELECT COUNT(*)::int AS followers FROM user_follows WHERE followee_id = $1`,
      [followedId]
    );

    return res.json({
      success: true,
      data: {
        following: existed.rowCount > 0,
        followers: cnt.rows[0]?.followers || 0,
      },
    });
  } catch (e) {
    console.error("follow status error", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/follows/me/stats
router.get("/me/stats", auth, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const [followersResult, followingResult] = await Promise.all([
      db.query(
        `SELECT COUNT(*)::int AS followers FROM user_follows WHERE followee_id = $1`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*)::int AS following FROM user_follows WHERE follower_id = $1`,
        [userId]
      ),
    ]);

    return res.json({
      success: true,
      data: {
        followers: followersResult.rows[0]?.followers || 0,
        following: followingResult.rows[0]?.following || 0,
      },
    });
  } catch (e) {
    console.error("follow me stats error", e);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;