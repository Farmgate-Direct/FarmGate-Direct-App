const express = require("express");
const router = express.Router();

const { getUser, updateUser } = require("../controllers/profilecontroller");

/* SAME ENDPOINTS NA GAMIT MO SA FRONTEND */
router.get("/:id", getUser);
router.patch("/:id", updateUser);

module.exports = router;