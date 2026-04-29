const express = require("express");
const router = express.Router();
const ExternalCategoryController = require("../controllers/comics/externalCategory.controller");

router.get("/", ExternalCategoryController.list);

module.exports = router;
