// server/app.js — Express app (no DB connect, no listen). Used by server.js and tests.
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const locationRoutes = require("./routes/locationRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const voteRoutes = require("./routes/voteRoutes");
const emailTestRoutes = require("./routes/emailTestRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// In tests, skip static + SPA catch-all (no client/build required in CI)
if (process.env.NODE_ENV !== "test") {
  app.use(express.static(path.join(__dirname, "../client/build")));
}

app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/test-email", emailTestRoutes);

if (process.env.NODE_ENV !== "test") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build/index.html"));
  });
}

module.exports = app;
