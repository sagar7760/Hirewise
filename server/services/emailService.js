const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const info = await transporter.sendMail({ from, to, subject, text, html });
  return info;
}

async function sendOtpEmail(to, code) {
  const appName = process.env.APP_NAME || 'HireWise';
  const expiryMins = Math.floor((parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10)));
  const subject = `Your ${appName} verification code`;
  const text = `Your verification code is ${code}. It expires in ${expiryMins} minutes.`;
  const html = `
  <div style="font-family: Arial, sans-serif; line-height:1.6;">
    <h2>${appName} Verification</h2>
    <p>Your verification code is:</p>
    <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</div>
    <p>This code will expire in <strong>${expiryMins} minutes</strong>.</p>
    <p>If you didn't request this, you can ignore this email.</p>
  </div>`;
  return sendEmail({ to, subject, text, html });
}

module.exports = {
  sendEmail,
  sendOtpEmail,
};
