// server/routes/locationRoutes.js
const express = require("express");
const Location = require("../models/Location");

const router = express.Router();

/**
 * CREATE a new location
 * POST /api/locations
 */
router.post("/", async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res
        .status(400)
        .json({ message: "Name and code are required" });
    }

    const existing = await Location.findOne({
      $or: [{ name }, { code }],
    });

    if (existing) {
      return res.status(400).json({
        message: "Location name or code already exists",
      });
    }

    const location = await Location.create({ name, code });

    return res.status(201).json({
      message: "Location created successfully",
      location,
    });
  } catch (error) {
    console.error("Location create error:", error);
    return res.status(500).json({
      message: "Server error while creating location",
    });
  }
});

/**
 * GET all locations
 * GET /api/locations
 */
router.get("/", async (req, res) => {
  try {
    const locations = await Location.find().sort({ name: 1 });
    return res.json({ locations });
  } catch (error) {
    console.error("Get locations error:", error);
    return res.status(500).json({
      message: "Server error while fetching locations",
    });
  }
});

/**
 * UPDATE a location
 * PUT /api/locations/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    if (!name || !code) {
      return res
        .status(400)
        .json({ message: "Name and code are required" });
    }

    const existing = await Location.findOne({
      _id: { $ne: id },
      $or: [{ name }, { code }],
    });

    if (existing) {
      return res.status(400).json({
        message: "Location name or code already exists",
      });
    }

    const location = await Location.findByIdAndUpdate(
      id,
      { name, code },
      { new: true }
    );

    if (!location) {
      return res
        .status(404)
        .json({ message: "Location not found" });
    }

    return res.json({
      message: "Location updated successfully",
      location,
    });
  } catch (error) {
    console.error("Update location error:", error);
    return res.status(500).json({
      message: "Server error while updating location",
    });
  }
});

/**
 * DELETE a location
 * DELETE /api/locations/:id
 *
 * ❗ No password check here.
 * The password confirmation is handled on the frontend
 * by calling /api/auth/login before this endpoint.
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findByIdAndDelete(id);

    if (!location) {
      return res
        .status(404)
        .json({ message: "Location not found" });
    }

    return res.json({
      message: "Location deleted successfully",
    });
  } catch (error) {
    console.error("Delete location error:", error);
    return res.status(500).json({
      message: "Server error while deleting location",
    });
  }
});

module.exports = router;
