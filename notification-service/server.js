const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./src/config/db");
const notificationRoutes = require("./src/routes/notification.routes");

require("dotenv").config();

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/notifications", notificationRoutes);

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

const PORT = process.env.PORT || 3006;

connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`Notification Service running on port ${PORT}`),
  );
});
