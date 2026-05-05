const User = require("../models/user.model");
const Token = require("../models/token.model");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt.utils");
const { successResponse, errorResponse } = require("../utils/response.utils");

// Helper: send refresh token as HttpOnly cookie
const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true, // JS cannot access this cookie
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ─── REGISTER ───────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 409, "Email already registered");
    }

    const user = await User.create({ firstName, lastName, email, password });

    return successResponse(res, 201, "Registration successful", { user });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── LOGIN ───────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      // Vague message intentionally — don't reveal which field is wrong
      return errorResponse(res, 401, "Invalid email or password");
    }

    if (!user.isActive) {
      return errorResponse(res, 403, "Account is deactivated");
    }

    const payload = { userId: user._id, email: user.email, role: user.role };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token to DB
    await Token.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    setRefreshCookie(res, refreshToken);

    return successResponse(res, 200, "Login successful", { accessToken, user });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── REFRESH TOKEN ───────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return errorResponse(res, 401, "No refresh token");

    // Verify token signature
    const decoded = verifyRefreshToken(token);

    // Check token exists in DB and is not revoked
    const storedToken = await Token.findOne({ token, isRevoked: false });
    if (!storedToken)
      return errorResponse(res, 401, "Invalid or revoked token");

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive)
      return errorResponse(res, 401, "User not found or inactive");

    const payload = { userId: user._id, email: user.email, role: user.role };
    const newAccessToken = generateAccessToken(payload);

    return successResponse(res, 200, "Token refreshed", {
      accessToken: newAccessToken,
    });
  } catch (err) {
    return errorResponse(res, 401, "Invalid refresh token");
  }
};

// ─── LOGOUT ──────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      // Revoke the token in DB
      await Token.findOneAndUpdate({ token }, { isRevoked: true });
      res.clearCookie("refreshToken");
    }
    return successResponse(res, 200, "Logged out successfully");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── GET CURRENT USER ─────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    // req.user is set by the API Gateway before forwarding the request
    const user = await User.findById(req.user.userId);
    if (!user) return errorResponse(res, 404, "User not found");
    return successResponse(res, 200, "User fetched", { user });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};
