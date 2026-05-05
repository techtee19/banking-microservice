const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  country: { type: String, trim: true },
  zipCode: { type: String, trim: true },
});

const customerSchema = new mongoose.Schema(
  {
    // Links this profile to the user in Auth Service
    userId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    address: { type: addressSchema, default: {} },
    avatar: { type: String }, // URL to profile image
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Customer", customerSchema);
