require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const registryRoutes = require("./src/routes/registry.routes");
const { sweepStaleServices } = require("./src/store/registry.store");

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Registry service is running" });
});

app.use("/api/registry", registryRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("[REGISTRY ERROR]", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Sweep the registry every 10s and mark services as down if they miss heartbeats
setInterval(sweepStaleServices, 10000);

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => console.log(`Service Registry running on port ${PORT}`));
