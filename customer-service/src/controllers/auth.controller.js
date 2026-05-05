const Customer = require("../models/customer.model");
const { successResponse, errorResponse } = require("../utils/response.utils");

// ─── CREATE PROFILE ────────────────────────────────────────────
// Called automatically after registration from Auth Service
exports.createProfile = async (req, res) => {
  try {
    const { userId, email } = req.user;
    const { firstName, lastName } = req.body;

    const existing = await Customer.findOne({ userId });
    if (existing) {
      return errorResponse(res, 409, "Customer profile already exists");
    }

    const customer = await Customer.create({
      userId,
      email,
      firstName,
      lastName,
      ...req.body,
    });

    return successResponse(res, 201, "Customer profile created", { customer });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── GET MY PROFILE ────────────────────────────────────────────
exports.getMyProfile = async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.user.userId });
    if (!customer) return errorResponse(res, 404, "Customer profile not found");

    return successResponse(res, 200, "Profile fetched", { customer });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── UPDATE MY PROFILE ─────────────────────────────────────────
exports.updateMyProfile = async (req, res) => {
  try {
    // Prevent updating sensitive fields
    const { userId, email, isActive, ...updateData } = req.body;

    const customer = await Customer.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!customer) return errorResponse(res, 404, "Customer profile not found");

    return successResponse(res, 200, "Profile updated", { customer });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── DELETE MY PROFILE ─────────────────────────────────────────
exports.deleteMyProfile = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: { isActive: false } }, // Soft delete
      { new: true },
    );

    if (!customer) return errorResponse(res, 404, "Customer profile not found");

    return successResponse(res, 200, "Profile deactivated successfully");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── ADMIN: GET ALL CUSTOMERS ──────────────────────────────────
exports.getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const query = { isActive: true };

    // Search by name or email
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    return successResponse(res, 200, "Customers fetched", {
      customers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── ADMIN: GET CUSTOMER BY ID ─────────────────────────────────
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.params.userId });
    if (!customer) return errorResponse(res, 404, "Customer not found");

    return successResponse(res, 200, "Customer fetched", { customer });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};
