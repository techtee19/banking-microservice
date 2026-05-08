require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/auth.routes");

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/auth/health", (req, res) => {
  res.json({ success: true, message: "Auth service is running" });
});

app.use("/api/auth", authRoutes);

app.use((err, req, res, next) => {
  console.error("[AUTH ERROR]", err);
  res.status(500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 3001;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Auth Service running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to start auth service:", err.message);
  });
