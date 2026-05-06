const Notification = require("../models/notification.model");
const { sendEmail } = require("../providers/email.provider");
const { getTemplate } = require("../templates/email.templates");
const { successResponse, errorResponse } = require("../utils/response.utils");

// ─── SEND NOTIFICATION (called by other services) ──────────────
exports.sendNotification = async (req, res) => {
  const { userId, email, type, channel = "email", data } = req.body;

  // Create notification record in pending state
  const notification = await Notification.create({
    userId,
    email,
    type,
    channel,
    data,
    status: "pending",
  });

  try {
    if (channel === "email") {
      // Get the right template
      const template = getTemplate(type, { data });

      if (!template) {
        throw new Error(`No template found for type: ${type}`);
      }

      notification.subject = template.subject;
      notification.body = template.html;

      // Send the email
      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
      });
    }

    // SMS channel — plug in Twilio here later
    if (channel === "sms") {
      console.log(`[SMS] Would send SMS to user ${userId} for ${type}`);
      // await sendSms({ to: phoneNumber, message: getSmsTemplate(type, data) });
    }

    notification.status = "sent";
    notification.sentAt = new Date();
    await notification.save();

    return successResponse(res, 200, "Notification sent", { notification });
  } catch (err) {
    notification.status = "failed";
    notification.error = err.message;
    await notification.save();

    console.error(`[NOTIFICATION ERROR] ${err.message}`);

    // Return 200 even on failure — notification errors should never
    // block the calling service (Transaction, Auth, etc.)
    return successResponse(res, 200, "Notification queued but failed to send", {
      notification,
    });
  }
};

// ─── GET MY NOTIFICATIONS ──────────────────────────────────────
exports.getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;

    const query = { userId: req.user.userId };
    if (type) query.type = type;
    if (status) query.status = status;

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .select("-body"); // Don't return full HTML body in list

    return successResponse(res, 200, "Notifications fetched", {
      notifications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── GET SINGLE NOTIFICATION ───────────────────────────────────
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return errorResponse(res, 404, "Notification not found");

    // Users can only view their own notifications
    if (req.user.role !== "admin" && notification.userId !== req.user.userId) {
      return errorResponse(res, 403, "Forbidden — not your notification");
    }

    return successResponse(res, 200, "Notification fetched", { notification });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── ADMIN: GET ALL NOTIFICATIONS ─────────────────────────────
exports.getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, userId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (userId) query.userId = userId;

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .select("-body");

    return successResponse(res, 200, "Notifications fetched", {
      notifications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// ─── ADMIN: RETRY FAILED NOTIFICATION ─────────────────────────
exports.retryNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return errorResponse(res, 404, "Notification not found");

    if (notification.status !== "failed") {
      return errorResponse(
        res,
        400,
        "Only failed notifications can be retried",
      );
    }

    const template = getTemplate(notification.type, {
      data: notification.data,
    });
    if (!template)
      return errorResponse(res, 400, "No template found for this type");

    await sendEmail({
      to: notification.email,
      subject: template.subject,
      html: template.html,
    });

    notification.status = "sent";
    notification.sentAt = new Date();
    notification.error = undefined;
    await notification.save();

    return successResponse(res, 200, "Notification resent successfully", {
      notification,
    });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};
