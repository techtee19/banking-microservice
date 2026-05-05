const authMiddleware = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  const email = req.headers["x-user-email"];
  const role = req.headers["x-user-role"];

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized — missing user context",
    });
  }

  req.user = { userId, email, role };
  next();
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden — insufficient permissions",
      });
    }
    next();
  };

// Validate internal service-to-service requests
const internalAuth = (req, res, next) => {
  const apiKey = req.headers["x-internal-api-key"];
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized — invalid internal API key",
    });
  }
  next();
};

module.exports = { authMiddleware, requireRole, internalAuth };
