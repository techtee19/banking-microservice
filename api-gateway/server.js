require("dotenv").config();

const express = require("express");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const routes = require("./src/routes/index");

const app = express();

app.use(
  helmet({
    // Enforce HSTS explicitly — browsers/clients must always use HTTPS for 1 year
    strictTransportSecurity: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
    },
  }),
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  }),
);

app.use("/", routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;
const HTTP_REDIRECT_PORT = process.env.HTTP_REDIRECT_PORT || 8080;
const USE_HTTPS = process.env.USE_HTTPS === "true";

if (USE_HTTPS) {
  const certPath = process.env.TLS_CERT_PATH
    ? path.resolve(process.env.TLS_CERT_PATH)
    : path.join(__dirname, "../certs/cert.pem");
  const keyPath = process.env.TLS_KEY_PATH
    ? path.resolve(process.env.TLS_KEY_PATH)
    : path.join(__dirname, "../certs/key.pem");

  const httpsOptions = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`API Gateway running with HTTPS on port ${PORT}`);
  });

  // HTTP → HTTPS redirect server, on its own separate port
  http
    .createServer((req, res) => {
      const host = req.headers.host?.split(":")[0] || "localhost";
      res.writeHead(301, { Location: `https://${host}:${PORT}${req.url}` });
      res.end();
    })
    .listen(HTTP_REDIRECT_PORT, () => {
      console.log(
        `HTTP redirect server running on port ${HTTP_REDIRECT_PORT} → https://localhost:${PORT}`,
      );
    });
} else {
  app.listen(PORT, () => {
    console.log(`API Gateway running with HTTP on port ${PORT}`);
  });
}
