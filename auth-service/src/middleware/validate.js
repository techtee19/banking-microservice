const Joi = require("joi");
const { errorResponse } = require("../utils/response.utils");

// Validation schemas
const schemas = {
  register: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required()
      .messages({
        "string.pattern.base":
          "Password must have uppercase, lowercase, number, and special character",
      }),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

// Middleware factory
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
