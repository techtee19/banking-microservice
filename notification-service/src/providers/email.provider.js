const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  // Create transporter here so env vars are already loaded
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log("[EMAIL CONFIG]", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? "SET" : "NOT SET",
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  console.log(`[EMAIL] Sent to ${to} — MessageId: ${info.messageId}`);
  return info;
};

module.exports = { sendEmail };
