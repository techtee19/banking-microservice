require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./src/config/db");
const paymentRoutes = require("./src/routes/payment.routes");
const {
  registerWithRegistry,
  startHeartbeat,
} = require("./src/utils/registry.client");

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/payments/health", (req, res) => {
  res.json({ success: true, message: "Payment service is running" });
});

app.use("/api/payments", paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("[PAYMENT ERROR]", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3007;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Payment Service running on port ${PORT}`);
    registerWithRegistry();
    startHeartbeat();
  });
});
