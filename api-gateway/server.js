require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const routes = require("./src/routes/index");

const app = express();

// Security & Middleware
app.use(helmet());
app.use(morgan("dev"));
// app.use(express.json());

// CORS — only allow specified origins
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true, // Allow cookies (refresh token)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  }),
);

// All routes
app.use("/", routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
