const Joi = require("joi");
const { errorResponse } = require("../utils/response.utils");

const schemas = {
  createCustomer: Joi.object({
    phone: Joi.string().min(7).max(20),
    dateOfBirth: Joi.date().max("now"),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      country: Joi.string(),
      zipCode: Joi.string(),
    }),
    avatar: Joi.string().uri(),
  }),

  updateCustomer: Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    phone: Joi.string().min(7).max(20),
    dateOfBirth: Joi.date().max("now"),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      country: Joi.string(),
      zipCode: Joi.string(),
    }),
    avatar: Joi.string().uri(),
  }),
};

const validate = (schemaName) => (req, res, next) => {
  const { error } = schemas[schemaName].validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return errorResponse(res, 400, "Validation failed", errors);
  }
  next();
};

module.exports = validate;
