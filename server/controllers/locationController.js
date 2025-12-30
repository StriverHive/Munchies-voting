// server/controllers/locationController.js
const Location = require("../models/Location");

// POST /api/locations
const createLocation = async (req, res) => {
  try {
    let { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        message: "Location name and code are required",
      });
    }

    name = name.trim();
    code = code.trim();

    if (!name || !code) {
      return res.status(400).json({
        message: "Location name and code cannot be empty",
      });
    }

    const exists = await Location.findOne({
      $or: [{ name }, { code }],
    });

    if (exists) {
      return res.status(400).json({
        message: "Location with this name or code already exists",
      });
    }

    const location = await Location.create({ name, code });

    return res.status(201).json({
      message: "Location created successfully",
      location,
    });
  } catch (error) {
    console.error("Create location error:", error);
    return res.status(500).json({
      message: "Server error while creating location",
    });
  }
};

// GET /api/locations
const getLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });

    return res.json({
      locations,
    });
  } catch (error) {
    console.error("Get locations error:", error);
    return res.status(500).json({
      message: "Server error while fetching locations",
    });
  }
};

// PUT /api/locations/:id
const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        message: "Location name and code are required",
      });
    }

    name = name.trim();
    code = code.trim();

    if (!name || !code) {
      return res.status(400).json({
        message: "Location name and code cannot be empty",
      });
    }

    const location = await Location.findById(id);

    if (!location) {
      return res.status(404).json({
        message: "Location not found",
      });
    }

    const exists = await Location.findOne({
      $or: [{ name }, { code }],
      _id: { $ne: id },
    });

    if (exists) {
      return res.status(400).json({
        message: "Another location with this name or code already exists",
      });
    }

    location.name = name;
    location.code = code;

    const updated = await location.save();

    return res.json({
      message: "Location updated successfully",
      location: updated,
    });
  } catch (error) {
    console.error("Update location error:", error);
    return res.status(500).json({
      message: "Server error while updating location",
    });
  }
};

// DELETE /api/locations/:id
const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findByIdAndDelete(id);

    if (!location) {
      return res.status(404).json({
        message: "Location not found",
      });
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
};

module.exports = {
  createLocation,
  getLocations,
  updateLocation,
  deleteLocation,
};
