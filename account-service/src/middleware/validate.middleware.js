const Joi = require("joi");
const { errorResponse } = require("../utils/response.utils");

const schemas = {
  createAccount: Joi.object({
    accountType: Joi.string()
      .valid("savings", "checking", "fixed_deposit")
      .required(),
    currency: Joi.string().length(3).default("USD"),
    dailyLimit: Joi.number().min(100).max(50000),
    isPrimary: Joi.boolean(),
  }),

  updateAccount: Joi.object({
    dailyLimit: Joi.number().min(100).max(50000),
    isPrimary: Joi.boolean(),
  }),

  updateBalance: Joi.object({
    amount: Joi.number().positive().required(),
    operation: Joi.string().valid("credit", "debit").required(),
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
