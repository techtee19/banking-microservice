const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./src/config/db");
const fraudRoutes = require("./src/routes/fraud.routes");

require("dotenv").config();

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/fraud", fraudRoutes);

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

const PORT = process.env.PORT || 3005;

connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`Fraud Detection Service running on port ${PORT}`),
  );
});
