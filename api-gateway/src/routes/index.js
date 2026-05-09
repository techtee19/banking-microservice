const express = require("express");
const axios = require("axios");
const router = express.Router();

const services = require("../config/services");
const authMiddleware = require("../middleware/auth.middleware");
const requestLogger = require("../middleware/logger.middleware");
const {
  globalLimiter,
  authLimiter,
  transactionLimiter,
} = require("../middleware/rateLimiter.middleware");

router.use(globalLimiter);
router.use(requestLogger);

// Health check
router.get("/health", (req, res) => {
  res.json({ success: true, message: "API Gateway is running" });
});

// ─── Manual proxy factory using axios ─────────────────────────
const createProxy = (targetUrl) => {
  return async (req, res) => {
    try {
      const url = `${targetUrl}${req.originalUrl}`;
      console.log(`[PROXY] ${req.method} ${req.originalUrl} → ${url}`);

      const response = await axios({
        method: req.method,
        url,
        data: req.body,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": req.headers["x-user-id"] || "",
          "x-user-email": req.headers["x-user-email"] || "",
          "x-user-role": req.headers["x-user-role"] || "",
          "x-internal-api-key": process.env.INTERNAL_API_KEY || "",
          cookie: req.headers["cookie"] || "",
        },
        timeout: 30000,
        withCredentials: true,
      });

      // Forward cookies from downstream service back to client
      const setCookie = response.headers["set-cookie"];
      if (setCookie) {
        res.setHeader("Set-Cookie", setCookie);
      }

      return res.status(response.status).json(response.data);
    } catch (err) {
      if (err.response) {
        // Service returned an error response — forward it
        return res.status(err.response.status).json(err.response.data);
      }
      console.error(`[PROXY ERROR] ${err.message}`);
      return res.status(502).json({
        success: false,
        message: "Service temporarily unavailable.",
      });
    }
  };
};

// ─── Auth Service (public) ─────────────────────────────────────
router.use(services.auth.prefix, authLimiter, (req, res) => {
  createProxy(services.auth.url)(req, res);
});

// ─── Customer Service ──────────────────────────────────────────
router.use(services.customer.prefix, authMiddleware, (req, res) => {
  createProxy(services.customer.url)(req, res);
});

// ─── Account Service ───────────────────────────────────────────
router.use(services.account.prefix, authMiddleware, (req, res) => {
  createProxy(services.account.url)(req, res);
});

// ─── Transaction Service ───────────────────────────────────────
router.use(
  services.transaction.prefix,
  authMiddleware,
  transactionLimiter,
  (req, res) => {
    createProxy(services.transaction.url)(req, res);
  },
);

// ─── Fraud Service ─────────────────────────────────────────────
router.use(services.fraud.prefix, authMiddleware, (req, res) => {
  createProxy(services.fraud.url)(req, res);
});

// ─── Notification Service ──────────────────────────────────────
router.use(services.notification.prefix, authMiddleware, (req, res) => {
  createProxy(services.notification.url)(req, res);
});

module.exports = router;
