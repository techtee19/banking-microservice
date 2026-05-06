// This service does NOT verify JWTs
// It simply reads the x-user-* headers injected by the API Gateway

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

// Role-based access control middleware
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

module.exports = { authMiddleware, requireRole };
