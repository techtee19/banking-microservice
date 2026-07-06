const Joi = require("joi");
const { errorResponse } = require("../utils/response.utils");

const schemas = {
  createPayment: Joi.object({
    sourceAccount: Joi.string().required(),
    type: Joi.string()
      .valid("card_payment", "bill_payment", "merchant_payment")
      .required(),
    amount: Joi.number().positive().min(0.01).required(),
    currency: Joi.string().length(3).default("USD"),
    description: Joi.string().max(255),
    payee: Joi.object({
      name: Joi.string().required(),
      provider: Joi.string().required(),
      reference: Joi.string().required(),
    }).required(),
  }),
};

const validate = (schemaName) => (req, res, next) => {
  const schema = schemas[schemaName];
  if (!schema) return next();

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return errorResponse(res, 400, "Validation failed", errors);
  }
  next();
};

module.exports = validate;
