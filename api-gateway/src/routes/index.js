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

router.use(globalLimiter);
router.use(requestLogger);

// Health check
router.get("/health", (req, res) => {
  res.json({ success: true, message: "API Gateway is running" });
});

// ─── Proxy factory ─────────────────────────────────────────────
const createProxy = (targetUrl) => {
  if (!targetUrl) {
    throw new Error(`[GATEWAY] Missing service URL — check your .env file`);
  }
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    selfHandleResponse: false,
    proxyTimeout: 30000,
    timeout: 30000,
    on: {
      error: (err, req, res) => {
        console.error(`[PROXY ERROR] ${err.message}`);
        if (!res.headersSent) {
          res.status(502).json({
            success: false,
            message: "Service temporarily unavailable.",
          });
        }
      },
      proxyReq: (proxyReq, req) => {
        if (req.body) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader("Content-Type", "application/json");
          proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      },
    },
  });
};

// ─── Auth Service (public) ─────────────────────────────────────
router.use(services.auth.prefix, authLimiter, createProxy(services.auth.url));

// ─── Customer Service ──────────────────────────────────────────
router.use(
  services.customer.prefix,
  authMiddleware,
  createProxy(services.customer.url),
);

// ─── Account Service ───────────────────────────────────────────
router.use(
  services.account.prefix,
  authMiddleware,
  createProxy(services.account.url),
);

// ─── Transaction Service ───────────────────────────────────────
router.use(
  services.transaction.prefix,
  authMiddleware,
  transactionLimiter,
  createProxy(services.transaction.url),
);

// ─── Fraud Service ─────────────────────────────────────────────
router.use(
  services.fraud.prefix,
  authMiddleware,
  createProxy(services.fraud.url),
);

// ─── Notification Service ──────────────────────────────────────
router.use(
  services.notification.prefix,
  authMiddleware,
  createProxy(services.notification.url),
);

module.exports = router;
