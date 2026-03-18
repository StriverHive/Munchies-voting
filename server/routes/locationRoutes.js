// server/routes/locationRoutes.js
const express = require("express");
const {
  createLocation,
  getLocations,
  updateLocation,
  deleteLocation,
} = require("../controllers/locationController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", requireAuth, createLocation);
router.get("/", requireAuth, getLocations);
router.put("/:id", requireAuth, updateLocation);
router.delete("/:id", requireAuth, deleteLocation);

module.exports = router;
