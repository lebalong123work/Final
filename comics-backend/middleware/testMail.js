require("dotenv").config();
const nodemailer = require("nodemailer");

(async () => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_APP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.MAIL_USER,
    subject: "Test mail",
    text: "Hello, test OK",
  });

  console.log("Sent:", info.messageId);
})();
