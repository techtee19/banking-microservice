const Joi = require("joi");
const { errorResponse } = require("../utils/response.utils");

const schemas = {
  sendNotification: Joi.object({
    userId: Joi.string().required(),
    email: Joi.string().email().required(),
    type: Joi.string()
      .valid(
        "transaction_success",
        "transaction_failed",
        "transaction_flagged",
        "login_success",
        "login_failed",
        "account_created",
        "account_frozen",
        "password_changed",
      )
      .required(),
    channel: Joi.string().valid("email", "sms", "push").default("email"),
    data: Joi.object().default({}),
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
