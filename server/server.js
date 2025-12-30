// server/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const locationRoutes = require("./routes/locationRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const voteRoutes = require("./routes/voteRoutes");
const emailTestRoutes = require("./routes/emailTestRoutes"); // ✅ NEW

app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/test-email", emailTestRoutes); // ✅ NEW

// Test route
app.get("/", (req, res) => {
  res.send("Voting System API is running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
