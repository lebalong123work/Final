const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const CommentController = require("../controllers/interactions/comment.controller");

router.get("/me/stats", auth, CommentController.getMyStats);
router.get("/", CommentController.getComments);
router.post("/", auth, CommentController.createComment);
router.delete("/:id", auth, CommentController.deleteComment);

module.exports = router;
