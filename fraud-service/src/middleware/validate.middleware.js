const Joi = require("joi");
const { errorResponse } = require("../utils/response.utils");

const schemas = {
  checkFraud: Joi.object({
    transactionRef: Joi.string().required(),
    userId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    type: Joi.string().valid("transfer", "deposit", "withdrawal").required(),
    sourceAccount: Joi.string(),
    destinationAccount: Joi.string(),
  }),

  addBlacklist: Joi.object({
    type: Joi.string().valid("userId", "accountNumber").required(),
    value: Joi.string().required(),
    reason: Joi.string().required(),
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
