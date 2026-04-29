const FollowModel = require("../../models/interactions/follow.model");

async function toggleFollow(req, res) {
  try {
    const followerId = Number(req.user.id);
    const followedId = Number(req.params.userId);

    if (!followedId) return res.status(400).json({ message: "userId invalid" });
    if (followedId === followerId) return res.status(400).json({ message: "Unable to follow myself" });

    const already = await FollowModel.isFollowing(followerId, followedId);
    if (already) {
      await FollowModel.unfollow(followerId, followedId);
    } else {
      await FollowModel.follow(followerId, followedId);
    }

    const followers = await FollowModel.getFollowerCount(followedId);
    return res.json({ success: true, data: { following: !already, followers } });
  } catch (e) {
    console.error("toggle follow error", e);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getFollowStatus(req, res) {
  try {
    const followerId = Number(req.user.id);
    const followedId = Number(req.params.userId);
    if (!followedId) return res.status(400).json({ message: "userId invalid" });

    const following = await FollowModel.isFollowing(followerId, followedId);
    const followers = await FollowModel.getFollowerCount(followedId);
    return res.json({ success: true, data: { following, followers } });
  } catch (e) {
    console.error("follow status error", e);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getMyStats(req, res) {
  try {
    const userId = Number(req.user.id);
    const [followers, following] = await Promise.all([
      FollowModel.getFollowerCount(userId),
      FollowModel.getFollowingCount(userId),
    ]);
    return res.json({ success: true, data: { followers, following } });
  } catch (e) {
    console.error("follow me stats error", e);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { toggleFollow, getFollowStatus, getMyStats };
