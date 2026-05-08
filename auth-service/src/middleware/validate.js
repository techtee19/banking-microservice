const Joi = require("joi");

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

const validate = (schemaName) => {
  return (req, res, next) => {
    console.log("[VALIDATE] body:", req.body); // ← add this temporarily
    const schema = schemas[schemaName];
    if (!schema) return next();

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((d) => d.message);
      return res
        .status(400)
        .json({ success: false, message: "Validation failed", errors });
    }
    return next();
  };
};

module.exports = validate;
