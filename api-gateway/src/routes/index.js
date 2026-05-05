const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const router = express.Router();

const services = require("../config/services");
const authMiddleware = require("../middleware/auth.middleware");
const requestLogger = require("../middleware/logger.middleware");
const {
  globalLimiter,
  authLimiter,
  transactionLimiter,
} = require("../middleware/rateLimiter.middleware");

// Apply global rate limiter and logger to all routes
router.use(globalLimiter);
router.use(requestLogger);

// Health check
router.get("/health", (req, res) => {
  res.json({ success: true, message: "API Gateway is running" });
});

// ─── Proxy factory ────────────────────────────────────────────────────
const createProxy = (targetUrl) =>
  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error(`[PROXY ERROR] ${err.message}`);
        res.status(502).json({
          success: false,
          message: "Service temporarily unavailable. Please try again later.",
        });
      },
    },
  });

// ─── Auth Service (public) ─────────────────────────────────────────────
router.use(services.auth.prefix, authLimiter, createProxy(services.auth.url));

// ─── Customer Service ──────────────────────────────────────────────────
router.use(
  services.customer.prefix,
  authMiddleware,
  createProxy(services.customer.url),
);

// ─── Account Service ───────────────────────────────────────────────────
router.use(
  services.account.prefix,
  authMiddleware,
  createProxy(services.account.url),
);

// ─── Transaction Service ───────────────────────────────────────────────
router.use(
  services.transaction.prefix,
  authMiddleware,
  transactionLimiter, // Extra rate limiting for transactions
  createProxy(services.transaction.url),
);

// ─── Fraud Detection Service ───────────────────────────────────────────
router.use(
  services.fraud.prefix,
  authMiddleware,
  createProxy(services.fraud.url),
);

// ─── Notification Service ──────────────────────────────────────────────
router.use(
  services.notification.prefix,
  authMiddleware,
  createProxy(services.notification.url),
);

module.exports = router;
