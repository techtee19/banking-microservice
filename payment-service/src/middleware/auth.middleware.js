const authMiddleware = (req, res, next) => {
  const internalApiKey = req.headers["x-internal-api-key"];
  if (internalApiKey && internalApiKey === process.env.INTERNAL_API_KEY) {
    req.user = {
      userId: req.headers["x-user-id"] || "internal",
      role: req.headers["x-user-role"] || "admin",
    };
    return next();
  }

  const userId = req.headers["x-user-id"];
  const email = req.headers["x-user-email"];
  const role = req.headers["x-user-role"];

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized — missing user context" });
  }

  req.user = { userId, email, role };
  next();
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Forbidden — insufficient permissions",
        });
    }
    next();
  };

module.exports = { authMiddleware, requireRole };
