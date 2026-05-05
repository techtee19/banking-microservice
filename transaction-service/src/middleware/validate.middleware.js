const Joi = require("joi");
const { errorResponse } = require("../utils/response.utils");

const schemas = {
  transfer: Joi.object({
    sourceAccount: Joi.string().required(),
    destinationAccount: Joi.string().required(),
    amount: Joi.number().positive().min(0.01).required(),
    currency: Joi.string().length(3).default("USD"),
    description: Joi.string().max(255),
  }),

  deposit: Joi.object({
    destinationAccount: Joi.string().required(),
    amount: Joi.number().positive().min(0.01).required(),
    currency: Joi.string().length(3).default("USD"),
    description: Joi.string().max(255),
  }),

  withdrawal: Joi.object({
    sourceAccount: Joi.string().required(),
    amount: Joi.number().positive().min(0.01).required(),
    currency: Joi.string().length(3).default("USD"),
    description: Joi.string().max(255),
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
