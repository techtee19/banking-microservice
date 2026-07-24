const crypto = require("crypto");
const IdempotencyKey = require("../models/idempotencyKey.model");

const hashBody = (body) => {
  return crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
};

const idempotency = () => {
  return async (req, res, next) => {
    const key = req.headers["idempotency-key"];

    if (!key) {
      return res.status(400).json({
        success: false,
        message: "Idempotency-Key header is required for this operation",
      });
    }

    const requestHash = hashBody(req.body);

    try {
      const existing = await IdempotencyKey.findOne({ key });

      if (existing) {
        // Same key, different payload — the client is misusing the key, reject clearly
        if (existing.requestHash !== requestHash) {
          return res.status(422).json({
            success: false,
            message:
              "Idempotency-Key was already used with a different request payload",
          });
        }

        // Original request is still being processed — tell the client to wait, don't reprocess
        if (existing.status === "processing") {
          return res.status(409).json({
            success: false,
            message:
              "A request with this Idempotency-Key is already being processed",
          });
        }

        // Already completed — replay the exact original response, do nothing new
        return res.status(existing.responseStatus).json(existing.responseBody);
      }

      // First time seeing this key — reserve it immediately as "processing"
      // so a second near-simultaneous request with the same key hits the
      // branch above instead of racing through to the controller too.
      await IdempotencyKey.create({
        key,
        userId: req.user.userId,
        requestHash,
        status: "processing",
      });

      // Capture the response so we can store it once the controller finishes
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        IdempotencyKey.findOneAndUpdate(
          { key },
          {
            status: "completed",
            responseStatus: res.statusCode,
            responseBody: body,
          },
        ).catch((err) =>
          console.error("[IDEMPOTENCY] Failed to save response:", err.message),
        );

        return originalJson(body);
      };

      next();
    } catch (err) {
      // Duplicate key error from the unique index — means two requests
      // with the exact same brand-new key raced to insert simultaneously.
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "A request with this Idempotency-Key is already being processed",
        });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  };
};

module.exports = idempotency;
