// server/routes/employeeRoutes.js
const express = require("express");
const multer = require("multer");
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  bulkCreateEmployees,
  exportEmployeesCsv,
  batchUpdateEmployees,
} = require("../controllers/employeeController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// NEW: Export employees as CSV
router.get("/export-csv", requireAuth, exportEmployeesCsv);

// Bulk CSV upload (create only – existing behaviour)
router.post("/bulk-upload", requireAuth, upload.single("file"), bulkCreateEmployees);

// NEW: Batch update (and create) via CSV
router.post("/batch-update", requireAuth, upload.single("file"), batchUpdateEmployees);

// Standard CRUD
router.get("/", requireAuth, getEmployees);
router.post("/", requireAuth, createEmployee);
router.put("/:id", requireAuth, updateEmployee);
router.delete("/:id", requireAuth, deleteEmployee);

module.exports = router;
