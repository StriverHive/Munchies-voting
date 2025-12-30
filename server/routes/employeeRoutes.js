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

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// NEW: Export employees as CSV
router.get("/export-csv", exportEmployeesCsv);

// Bulk CSV upload (create only – existing behaviour)
router.post("/bulk-upload", upload.single("file"), bulkCreateEmployees);

// NEW: Batch update (and create) via CSV
router.post("/batch-update", upload.single("file"), batchUpdateEmployees);

// Standard CRUD
router.get("/", getEmployees);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

module.exports = router;
