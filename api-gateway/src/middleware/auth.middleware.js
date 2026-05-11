const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access token required" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    console.log("[GATEWAY AUTH] decoded:", decoded); // ← add this

    // Attach user info to request headers so downstream services can use it
    // without verifying the JWT themselves
    req.headers["x-user-id"] = decoded.userId;
    req.headers["x-user-email"] = decoded.email;
    req.headers["x-user-role"] = decoded.role;

    // Remove the Authorization header before forwarding (optional: keep if services need it)
    // delete req.headers["authorization"];

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Access token expired" });
    }
    return res
      .status(401)
      .json({ success: false, message: "Invalid access token" });
  }
};

module.exports = authMiddleware;
