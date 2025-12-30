// server/controllers/employeeController.js
const { parse } = require("csv-parse/sync");
const Employee = require("../models/Employee");
const Location = require("../models/Location");

/**
 * Helper to safely read a field from possible header names (for flexible CSVs)
 */
const getField = (row, fieldNames) => {
  for (const name of fieldNames) {
    if (row[name] !== undefined && row[name] !== null) {
      const value = String(row[name]).trim();
      if (value) return value;
    }
  }
  return "";
};

/**
 * Helper to escape values for CSV export
 */
const escapeCsvValue = (val) => {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (/[",\r\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

// GET /api/employees
// Supports:
//   - Optional search by employee name or location name/code (?search=...)
//   - Optional pagination with page & pageSize (?page=1&pageSize=10)
// If page & pageSize are NOT provided => return all employees (backwards compatible)
const getEmployees = async (req, res) => {
  try {
    let { page, pageSize, search } = req.query;

    let filter = {};
    const trimmedSearch = typeof search === "string" ? search.trim() : "";

    if (trimmedSearch) {
      const regex = new RegExp(trimmedSearch, "i");

      const matchingLocations = await Location.find({
        $or: [{ name: regex }, { code: regex }],
      }).select("_id");

      const locationIds = matchingLocations.map((loc) => loc._id);

      const orConditions = [{ firstName: regex }, { lastName: regex }];

      if (locationIds.length > 0) {
        orConditions.push({ locations: { $in: locationIds } });
      }

      filter = { $or: orConditions };
    }

    if (page && pageSize) {
      let currentPage = parseInt(page, 10);
      let perPage = parseInt(pageSize, 10);

      if (!Number.isFinite(currentPage) || currentPage < 1) currentPage = 1;
      if (!Number.isFinite(perPage) || perPage < 1) perPage = 10;

      const skip = (currentPage - 1) * perPage;

      const [employees, total] = await Promise.all([
        Employee.find(filter)
          .populate("locations", "name code")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(perPage),
        Employee.countDocuments(filter),
      ]);

      return res.json({
        employees,
        page: currentPage,
        pageSize: perPage,
        total,
      });
    }

    const employees = await Employee.find(filter)
      .populate("locations", "name code")
      .sort({ createdAt: -1 });

    return res.json({ employees });
  } catch (error) {
    console.error("Get employees error:", error);
    return res.status(500).json({
      message: "Server error while fetching employees",
    });
  }
};

// POST /api/employees
const createEmployee = async (req, res) => {
  try {
    const { firstName, lastName, email, employeeId, locationIds } = req.body;

    if (!firstName || !lastName || !employeeId || !email) {
      return res.status(400).json({
        message: "firstName, lastName, employeeId and email are required",
      });
    }

    const normalizedEmployeeId = String(employeeId).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await Employee.findOne({
      $or: [{ employeeId: normalizedEmployeeId }, { email: normalizedEmail }],
    });

    if (existing) {
      return res.status(400).json({
        message: "An employee with this employeeId or email already exists",
      });
    }

    let locations = [];
    if (Array.isArray(locationIds) && locationIds.length) {
      locations = await Location.find({ _id: { $in: locationIds } }).select(
        "_id"
      );
    }

    if (!locations.length) {
      return res.status(400).json({
        message: "At least one valid locationId is required",
      });
    }

    const employee = await Employee.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: normalizedEmail,
      employeeId: normalizedEmployeeId,
      locations: locations.map((l) => l._id),
    });

    const populated = await Employee.findById(employee._id).populate(
      "locations",
      "name code"
    );

    return res.status(201).json({
      message: "Employee created successfully",
      employee: populated,
    });
  } catch (error) {
    console.error("Create employee error:", error);
    let message = "Server error while creating employee";

    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        message = "Email is already in use";
      } else if (error.keyPattern?.employeeId) {
        message = "Employee ID is already in use";
      }
    }

    return res.status(500).json({ message });
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, employeeId, locationIds } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (employeeId || email) {
      const query = {
        _id: { $ne: id },
        $or: [],
      };
      if (employeeId) query.$or.push({ employeeId: String(employeeId).trim() });
      if (email)
        query.$or.push({ email: String(email).trim().toLowerCase() });

      if (query.$or.length) {
        const existing = await Employee.findOne(query);
        if (existing) {
          return res.status(400).json({
            message:
              "Another employee with this employeeId or email already exists",
          });
        }
      }
    }

    let locations = [];
    if (Array.isArray(locationIds) && locationIds.length) {
      locations = await Location.find({
        _id: { $in: locationIds },
      }).select("_id");

      if (!locations.length) {
        return res.status(400).json({
          message: "At least one valid locationId is required",
        });
      }

      employee.locations = locations.map((l) => l._id);
    }

    if (firstName !== undefined) employee.firstName = String(firstName).trim();
    if (lastName !== undefined) employee.lastName = String(lastName).trim();
    if (email !== undefined) employee.email = String(email).trim().toLowerCase();
    if (employeeId !== undefined)
      employee.employeeId = String(employeeId).trim();

    await employee.save();

    const populated = await Employee.findById(employee._id).populate(
      "locations",
      "name code"
    );

    return res.json({
      message: "Employee updated successfully",
      employee: populated,
    });
  } catch (error) {
    console.error("Update employee error:", error);
    return res.status(500).json({
      message: "Server error while updating employee",
    });
  }
};

// DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    await Employee.deleteOne({ _id: id });

    return res.json({
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    return res.status(500).json({
      message: "Server error while deleting employee",
    });
  }
};

// POST /api/employees/bulk-upload
// (kept as-is)
const bulkCreateEmployees = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "CSV file is required" });
    }

    const csvString = req.file.buffer.toString("utf-8");

    let rows = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (!rows.length) {
      return res.status(400).json({ message: "CSV file is empty" });
    }

    const normalizeHeaderKey = (key) =>
      String(key).replace(/^\uFEFF/, "").trim();

    rows = rows.map((row) => {
      const normalizedRow = {};
      Object.keys(row).forEach((key) => {
        const normKey = normalizeHeaderKey(key);
        normalizedRow[normKey] = row[key];
      });
      return normalizedRow;
    });

    const allCodesSet = new Set();
    rows.forEach((row) => {
      const codesStr = getField(row, [
        "locationCodes",
        "locationCode",
        "LocationCodes",
        "LocationCode",
        "Location Codes",
        "Location Code",
        "StoreCodes",
        "StoreCode",
        "Store Codes",
        "Store Code",
        "store",
        "Store",
      ]);
      if (!codesStr) return;

      codesStr
        .split(/[;,]/)
        .map((c) => String(c).trim())
        .filter(Boolean)
        .forEach((c) => allCodesSet.add(c.toLowerCase()));
    });

    const allCodes = Array.from(allCodesSet);

    const locations = await Location.find({
      code: { $in: allCodes },
    }).select("_id code");

    const codeToId = new Map();
    locations.forEach((loc) => {
      const key = String(loc.code || "").trim().toLowerCase();
      if (key) codeToId.set(key, loc._id);
    });

    let created = 0;
    const errors = [];
    let rowNumber = 1;

    for (const row of rows) {
      const currentRow = rowNumber++;

      const employeeId = getField(row, [
        "employeeId",
        "EmployeeId",
        "Employee ID",
        "EMPID",
        "EmpID",
        "empId",
      ]);
      const firstName = getField(row, [
        "firstName",
        "FirstName",
        "First Name",
        "firstname",
        "FIRSTNAME",
      ]);
      const lastName = getField(row, [
        "lastName",
        "LastName",
        "Last Name",
        "lastname",
        "LASTNAME",
      ]);
      const email = getField(row, [
        "email",
        "Email",
        "E-mail",
        "E mail",
        "Email Address",
        "emailAddress",
      ]);

      const codesStr = getField(row, [
        "locationCodes",
        "locationCode",
        "LocationCodes",
        "LocationCode",
        "Location Codes",
        "Location Code",
        "StoreCodes",
        "StoreCode",
        "Store Codes",
        "Store Code",
        "store",
        "Store",
      ]);

      if (!employeeId || !firstName || !lastName || !email || !codesStr) {
        errors.push({
          rowNumber: currentRow,
          employeeId,
          reason:
            "Missing required fields (employeeId, firstName, lastName, email, locationCodes)",
        });
        continue;
      }

      const codes = codesStr
        .split(/[;,]/)
        .map((c) => String(c).trim())
        .filter(Boolean);

      const locationIds = [];
      codes.forEach((code) => {
        const id = codeToId.get(String(code).toLowerCase());
        if (id) locationIds.push(id);
      });

      if (!locationIds.length) {
        errors.push({
          rowNumber: currentRow,
          employeeId,
          reason: `No valid locations found for codes "${codesStr}". Codes must match Location.code in the system.`,
        });
        continue;
      }

      const normalizedEmployeeId = String(employeeId).trim();
      const normalizedEmail = String(email).trim().toLowerCase();

      const existing = await Employee.findOne({
        $or: [{ employeeId: normalizedEmployeeId }, { email: normalizedEmail }],
      });
      if (existing) {
        errors.push({
          rowNumber: currentRow,
          employeeId,
          reason: "Employee with this employeeId or email already exists",
        });
        continue;
      }

      try {
        await Employee.create({
          firstName: String(firstName).trim(),
          lastName: String(lastName).trim(),
          email: normalizedEmail,
          employeeId: normalizedEmployeeId,
          locations: locationIds,
        });
        created++;
      } catch (err) {
        let reason = err.message;
        if (err.code === 11000) {
          if (err.keyPattern?.email) reason = "Email is already in use";
          else if (err.keyPattern?.employeeId) reason = "Employee ID is already in use";
        }
        errors.push({ rowNumber: currentRow, employeeId, reason });
      }
    }

    return res.json({
      message: "Bulk upload finished",
      totalRows: rows.length,
      created,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    console.error("Bulk create employees error:", error);
    return res.status(500).json({
      message: "Server error while importing employees",
    });
  }
};

/**
 * Export all employees as CSV
 */
const exportEmployeesCsv = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("locations", "code name")
      .sort({ createdAt: 1 });

    const header = "employeeId,firstName,lastName,email,locationCodes";
    const lines = [header];

    employees.forEach((emp) => {
      const locationCodes = Array.isArray(emp.locations)
        ? emp.locations
            .map((loc) => (loc && loc.code !== undefined ? String(loc.code) : ""))
            .filter(Boolean)
            .join(";")
        : "";

      const row = [
        escapeCsvValue(emp.employeeId || ""),
        escapeCsvValue(emp.firstName || ""),
        escapeCsvValue(emp.lastName || ""),
        escapeCsvValue(emp.email || ""),
        escapeCsvValue(locationCodes),
      ].join(",");

      lines.push(row);
    });

    const csvString = lines.join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="employees-export.csv"'
    );

    return res.send(csvString);
  } catch (error) {
    console.error("Export employees CSV error:", error);
    return res.status(500).json({
      message: "Server error while exporting employees",
    });
  }
};

/**
 * ✅ Batch update (or create) employees from CSV
 *
 * Matching rules:
 * 1) Try match by employeeId
 * 2) If not found -> try match by email
 *    - If matched by email, allow updating employeeId too (if not taken)
 * 3) If neither match -> create new employee (requires full data)
 *
 * Update rules:
 * - Update ONLY changed fields
 * - Skip if no changes
 * - If locationCodes present but invalid => BLOCK whole row
 * - Auto detect CSV vs TSV delimiter
 * - Flexible header names
 */
const batchUpdateEmployees = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "CSV file is required" });
    }

    const raw = req.file.buffer.toString("utf-8");
    const firstLine = raw.split(/\r?\n/)[0] || "";

    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const delimiter = tabCount > commaCount ? "\t" : ",";

    let rows = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter,
    });

    if (!rows.length) {
      return res.status(400).json({ message: "CSV file is empty" });
    }

    const normalizeHeaderKey = (key) =>
      String(key).replace(/^\uFEFF/, "").trim();

    rows = rows.map((row) => {
      const normalizedRow = {};
      Object.keys(row).forEach((key) => {
        normalizedRow[normalizeHeaderKey(key)] = row[key];
      });
      return normalizedRow;
    });

    // Collect all location codes for lookup
    const allCodesSet = new Set();
    rows.forEach((row) => {
      const codesStr = getField(row, [
        "locationCodes",
        "locationCode",
        "LocationCodes",
        "LocationCode",
        "Location Codes",
        "Location Code",
        "StoreCodes",
        "StoreCode",
        "Store Codes",
        "Store Code",
        "store",
        "Store",
      ]);
      if (!codesStr) return;

      codesStr
        .split(/[;,]/)
        .map((c) => String(c).trim())
        .filter(Boolean)
        .forEach((c) => allCodesSet.add(c.toLowerCase()));
    });

    const allCodes = Array.from(allCodesSet);

    const locations = await Location.find({
      code: { $in: allCodes },
    }).select("_id code");

    const codeToId = new Map();
    locations.forEach((loc) => {
      const key = String(loc.code || "").trim().toLowerCase();
      if (key) codeToId.set(key, loc._id);
    });

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];
    let rowNumber = 1;

    for (const row of rows) {
      const currentRow = rowNumber++;

      const employeeId = getField(row, [
        "employeeId",
        "EmployeeId",
        "Employee ID",
        "EMPID",
        "EmpID",
        "empId",
      ]);

      const firstName = getField(row, [
        "firstName",
        "FirstName",
        "First Name",
        "firstname",
        "FIRSTNAME",
      ]);
      const lastName = getField(row, [
        "lastName",
        "LastName",
        "Last Name",
        "lastname",
        "LASTNAME",
      ]);

      const emailRaw = getField(row, [
        "email",
        "Email",
        "E-mail",
        "E mail",
        "Email Address",
        "emailAddress",
      ]);
      const email = emailRaw ? String(emailRaw).trim().toLowerCase() : "";

      const codesStr = getField(row, [
        "locationCodes",
        "locationCode",
        "LocationCodes",
        "LocationCode",
        "Location Codes",
        "Location Code",
        "StoreCodes",
        "StoreCode",
        "Store Codes",
        "Store Code",
        "store",
        "Store",
      ]);

      if (!employeeId && !email) {
        errors.push({
          rowNumber: currentRow,
          employeeId: "",
          reason: "Row must have at least employeeId or email to match",
        });
        continue;
      }

      const normalizedEmployeeId = employeeId ? String(employeeId).trim() : "";

      // 1) Try match by employeeId
      let target = null;
      let matchedBy = "";

      if (normalizedEmployeeId) {
        target = await Employee.findOne({ employeeId: normalizedEmployeeId });
        if (target) matchedBy = "employeeId";
      }

      // 2) Fallback match by email if not found by employeeId
      if (!target && email) {
        target = await Employee.findOne({ email });
        if (target) matchedBy = "email";
      }

      // If still not found -> create new
      if (!target) {
        // For creation, require full set
        if (!normalizedEmployeeId || !firstName || !lastName || !email || !codesStr) {
          errors.push({
            rowNumber: currentRow,
            employeeId: normalizedEmployeeId || "",
            reason:
              "Cannot create new employee – missing one of employeeId, firstName, lastName, email or locationCodes",
          });
          continue;
        }

        // Resolve locations
        const codes = String(codesStr)
          .split(/[;,]/)
          .map((c) => String(c).trim())
          .filter(Boolean);

        const locationIds = [];
        codes.forEach((code) => {
          const id = codeToId.get(String(code).toLowerCase());
          if (id) locationIds.push(id);
        });

        if (!locationIds.length) {
          errors.push({
            rowNumber: currentRow,
            employeeId: normalizedEmployeeId,
            reason: `No valid locations found for codes "${codesStr}". Codes must match Location.code in the system.`,
          });
          continue;
        }

        // Ensure employeeId not used
        const existingIdOwner = await Employee.findOne({
          employeeId: normalizedEmployeeId,
        });
        if (existingIdOwner) {
          errors.push({
            rowNumber: currentRow,
            employeeId: normalizedEmployeeId,
            reason: "Cannot create – employeeId already in use",
          });
          continue;
        }

        // Ensure email not used
        const existingEmailOwner = await Employee.findOne({ email });
        if (existingEmailOwner) {
          errors.push({
            rowNumber: currentRow,
            employeeId: normalizedEmployeeId,
            reason: "Cannot create – email already in use",
          });
          continue;
        }

        try {
          await Employee.create({
            firstName,
            lastName,
            email,
            employeeId: normalizedEmployeeId,
            locations: locationIds,
          });
          created++;
        } catch (err) {
          let reason = err.message;
          if (err.code === 11000) {
            if (err.keyPattern?.email) reason = "Email is already in use";
            else if (err.keyPattern?.employeeId) reason = "Employee ID is already in use";
          }
          errors.push({
            rowNumber: currentRow,
            employeeId: normalizedEmployeeId,
            reason,
          });
        }

        continue;
      }

      // UPDATE existing target
      const updates = {};
      let changed = false;

      // If matched by email, and CSV employeeId is present & different, update employeeId too
      if (matchedBy === "email" && normalizedEmployeeId) {
        if (normalizedEmployeeId !== target.employeeId) {
          const idOwner = await Employee.findOne({
            _id: { $ne: target._id },
            employeeId: normalizedEmployeeId,
          });
          if (idOwner) {
            errors.push({
              rowNumber: currentRow,
              employeeId: normalizedEmployeeId,
              reason:
                "Cannot update employeeId – already in use by another employee",
            });
            continue;
          }

          updates.employeeId = normalizedEmployeeId;
          changed = true;
        }
      }

      // Names
      if (firstName && firstName !== target.firstName) {
        updates.firstName = firstName;
        changed = true;
      }
      if (lastName && lastName !== target.lastName) {
        updates.lastName = lastName;
        changed = true;
      }

      // Email change (only if provided, different, and not taken)
      if (email && email !== target.email) {
        const emailOwner = await Employee.findOne({
          _id: { $ne: target._id },
          email,
        });
        if (emailOwner) {
          errors.push({
            rowNumber: currentRow,
            employeeId: normalizedEmployeeId || target.employeeId,
            reason: "Cannot update email – already in use by another employee",
          });
          continue;
        }
        updates.email = email;
        changed = true;
      }

      // Locations: if codesStr present but invalid => BLOCK whole row
      if (codesStr) {
        const codes = String(codesStr)
          .split(/[;,]/)
          .map((c) => String(c).trim())
          .filter(Boolean);

        const locationIds = [];
        codes.forEach((code) => {
          const id = codeToId.get(String(code).toLowerCase());
          if (id) locationIds.push(id);
        });

        if (!locationIds.length) {
          errors.push({
            rowNumber: currentRow,
            employeeId: normalizedEmployeeId || target.employeeId,
            reason: `No valid locations found for codes "${codesStr}". Codes must match Location.code in the system.`,
          });
          continue; // block entire row
        }

        const existingIds = (target.locations || []).map((x) => String(x));
        const newIds = locationIds.map((x) => String(x));

        const sameLength = existingIds.length === newIds.length;
        const sameSet =
          sameLength && existingIds.every((id) => newIds.includes(id));

        if (!sameSet) {
          updates.locations = locationIds;
          changed = true;
        }
      }

      if (!changed) {
        skipped++;
        continue;
      }

      try {
        Object.assign(target, updates);
        await target.save();
        updated++;
      } catch (err) {
        let reason = err.message;
        if (err.code === 11000) {
          if (err.keyPattern?.email) reason = "Email is already in use";
          else if (err.keyPattern?.employeeId) reason = "Employee ID is already in use";
        }
        errors.push({
          rowNumber: currentRow,
          employeeId: normalizedEmployeeId || target.employeeId,
          reason,
        });
      }
    }

    const summary = {
      totalRows: rows.length,
      created,
      updated,
      skipped,
      failed: errors.length,
      delimiterDetected: delimiter === "\t" ? "TAB (TSV)" : "COMMA (CSV)",
    };

    console.log("✅ Batch update summary:", summary);

    if (errors.length) {
      console.log("❌ Batch update errors (first 50):");
      console.table(errors.slice(0, 50));
    }

    return res.json({
      message: "Batch update finished",
      ...summary,
      errors,
      meta: {
        delimiterDetected: delimiter === "\t" ? "TAB (TSV)" : "COMMA (CSV)",
      },
    });
  } catch (error) {
    console.error("Batch update employees error:", error);
    return res.status(500).json({
      message: "Server error while batch updating employees",
    });
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  bulkCreateEmployees,
  exportEmployeesCsv,
  batchUpdateEmployees,
};
