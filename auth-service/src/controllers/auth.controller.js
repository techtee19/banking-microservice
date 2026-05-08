const User = require("../models/user.model");
const Token = require("../models/token.model");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt.utils");
const { successResponse, errorResponse } = require("../utils/response.utils");

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// ─── REGISTER ────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    console.log("[REGISTER] body received:", req.body);

    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({ firstName, lastName, email, password });
    const userObj = user.toJSON();

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { user: userObj },
    });
  } catch (err) {
    console.error("[REGISTER ERROR]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "Account is deactivated" });
    }

    const payload = { userId: user._id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await Token.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { accessToken, user: user.toJSON() },
    });
  } catch (err) {
    console.error("[LOGIN ERROR]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── REFRESH TOKEN ───────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token" });
    }

    const decoded = verifyRefreshToken(token);
    const storedToken = await Token.findOne({ token, isRevoked: false });
    if (!storedToken) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or revoked token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "User not found or inactive" });
    }

    const payload = { userId: user._id, email: user.email, role: user.role };
    const newAccessToken = generateAccessToken(payload);

    return res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    console.error("[REFRESH ERROR]", err.message);
    return res
      .status(401)
      .json({ success: false, message: "Invalid refresh token" });
  }
};

// ─── LOGOUT ──────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await Token.findOneAndUpdate({ token }, { isRevoked: true });
      res.clearCookie("refreshToken");
    }
    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("[LOGOUT ERROR]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET ME ───────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      message: "User fetched",
      data: { user: user.toJSON() },
    });
  } catch (err) {
    console.error("[GET ME ERROR]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
