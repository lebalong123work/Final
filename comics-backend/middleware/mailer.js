const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || "true") === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendNewPasswordMail(toEmail, newPassword) {
  const from = process.env.SMTP_USER;

  return transporter.sendMail({
    from: `Readink <${from}>`,
    to: toEmail,
    subject: "Readink - Your new password",
    html: `
      <div style="font-family:Arial; line-height:1.6">
        <h3>Password reset request</h3>
        <p>You have requested to reset your password. Here is your new password:</p>
        <p style="font-size:18px; font-weight:bold;">${newPassword}</p>
      </div>
    `,
  });
}

module.exports = { transporter, sendNewPasswordMail };
