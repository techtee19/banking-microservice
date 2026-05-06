// All email templates in one place — easy to update later
const templates = {
  transaction_success: ({ data }) => ({
    subject: `✅ Transaction Successful — ${data.transactionRef}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2e7d32;">Transaction Successful</h2>
        <p>Your <strong>${data.type}</strong> transaction has been completed.</p>
        <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reference</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.transactionRef}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.currency} ${data.amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.type}</td>
          </tr>
        </table>
        <p style="margin-top: 24px; color: #777; font-size: 12px;">
          If you did not initiate this transaction, please contact support immediately.
        </p>
      </div>
    `,
  }),

  transaction_failed: ({ data }) => ({
    subject: `❌ Transaction Failed — ${data.transactionRef}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c62828;">Transaction Failed</h2>
        <p>Your <strong>${data.type}</strong> transaction could not be completed.</p>
        <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reference</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.transactionRef}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.currency} ${data.amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reason</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; color: #c62828;">${data.reason || "Unknown"}</td>
          </tr>
        </table>
        <p style="margin-top: 24px; color: #777; font-size: 12px;">
          Please check your account balance and try again.
        </p>
      </div>
    `,
  }),

  transaction_flagged: ({ data }) => ({
    subject: `⚠️ Suspicious Transaction Detected — ${data.transactionRef}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e65100;">Suspicious Transaction Flagged</h2>
        <p>A transaction on your account has been flagged as suspicious and blocked.</p>
        <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reference</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.transactionRef}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.currency} ${data.amount}</td>
          </tr>
        </table>
        <p style="margin-top: 16px; color: #e65100;">
          If this was you, please contact support to unlock your account.
        </p>
      </div>
    `,
  }),

  login_success: ({ data }) => ({
    subject: "🔐 New Login Detected",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1565c0;">New Login to Your Account</h2>
        <p>A successful login was detected on your account.</p>
        <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Time</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${new Date().toUTCString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>IP Address</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.ipAddress || "Unknown"}</td>
          </tr>
        </table>
        <p style="margin-top: 16px; color: #777; font-size: 12px;">
          If this wasn't you, please change your password immediately.
        </p>
      </div>
    `,
  }),

  account_created: ({ data }) => ({
    subject: "🎉 Your Account Has Been Created",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2e7d32;">Welcome to SecureBank!</h2>
        <p>Your <strong>${data.accountType}</strong> account has been successfully created.</p>
        <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Account Number</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.accountNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.accountType}</td>
          </tr>
        </table>
      </div>
    `,
  }),

  account_frozen: ({ data }) => ({
    subject: "🔒 Your Account Has Been Frozen",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c62828;">Account Frozen</h2>
        <p>Your account <strong>${data.accountNumber}</strong> has been frozen.</p>
        <p>Reason: <strong>${data.reason || "Security concern"}</strong></p>
        <p>Please contact support to resolve this issue.</p>
      </div>
    `,
  }),

  password_changed: () => ({
    subject: "🔑 Your Password Has Been Changed",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1565c0;">Password Changed</h2>
        <p>Your account password was recently changed.</p>
        <p style="color: #c62828;">
          If you did not make this change, please contact support immediately.
        </p>
      </div>
    `,
  }),
};

const getTemplate = (type, payload) => {
  const templateFn = templates[type];
  if (!templateFn) return null;
  return templateFn(payload);
};

module.exports = { getTemplate };
