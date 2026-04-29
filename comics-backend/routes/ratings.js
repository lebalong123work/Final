const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const RatingController = require("../controllers/interactions/rating.controller");

router.get("/:comicType/:comicId",       RatingController.getSummary);
router.get("/:comicType/:comicId/mine",  auth, RatingController.getMyRating);
router.post("/:comicType/:comicId",      auth, RatingController.upsertRating);

module.exports = router;
