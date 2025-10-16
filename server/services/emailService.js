const nodemailer = require('nodemailer');

// Create transporter with better error handling
function createTransporter() {
  const config = {
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  // If EMAIL_SERVICE is set, use it (gmail, etc.)
  if (process.env.EMAIL_SERVICE) {
    config.service = process.env.EMAIL_SERVICE;
  } else {
    // Otherwise use custom SMTP settings
    config.host = process.env.EMAIL_HOST;
    config.port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587;
    config.secure = process.env.EMAIL_SECURE === 'true';
  }

  console.log('📧 Email transporter config:', {
    service: config.service || 'custom SMTP',
    host: config.host,
    port: config.port,
    user: config.auth.user,
    passLength: config.auth.pass?.length || 0
  });

  return nodemailer.createTransport(config);
}

const transporter = createTransporter();

// Verify transporter on startup (async)
(async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service ready to send messages');
  } catch (error) {
    console.error('❌ Email service configuration error:', error.message);
    console.error('💡 Tip: For Gmail, use App Password. Run: node server/scripts/setup-ethereal-email.js for testing');
  }
})();

async function sendEmail({ to, subject, text, html }) {
  try {
    console.log(`📤 Attempting to send email to: ${to}`);
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const info = await transporter.sendMail({ from, to, subject, text, html });
    
    console.log('✅ Email sent successfully:', info.messageId);
    
    // Log preview URL for Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Preview email: %s', previewUrl);
    }
    
    return info;
  } catch (error) {
    console.error('❌ Email send failed - Full error:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Re-throw with more context
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check EMAIL_USER and EMAIL_PASS in .env file.');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Could not connect to email server. Please check your internet connection.');
    } else {
      throw new Error(`Email send failed: ${error.message}`);
    }
  }
}

async function sendOtpEmail(to, code) {
  const appName = process.env.APP_NAME || 'HireWise';
  const expiryMins = Math.floor((parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10)));
  const subject = `${code} is your ${appName} verification code`;
  const text = `Your verification code is ${code}. It expires in ${expiryMins} minutes. If you didn't request this, please ignore this email.`;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Open Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #000000 0%, #1f2937 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Open Sans', sans-serif;">
        ${appName}
      </h1>
      <p style="color: rgba(255, 255, 255, 0.85); margin: 10px 0 0; font-size: 16px; font-weight: 400;">
        Verify Your Email Address
      </p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px; font-family: 'Roboto', sans-serif;">
        Thank you for registering with ${appName}! Please use the verification code below to complete your registration:
      </p>
      
      <!-- OTP Code Box -->
      <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border: 2px solid #000000; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0;">
        <div style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; font-family: 'Roboto', sans-serif;">
          Your Verification Code
        </div>
        <div style="font-size: 40px; font-weight: 700; letter-spacing: 10px; color: #000000; font-family: 'Courier New', monospace; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">
          ${code}
        </div>
      </div>
      
      <!-- Important Info -->
      <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 18px 20px; border-radius: 6px; margin: 24px 0;">
        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6; font-family: 'Roboto', sans-serif;">
          <strong style="font-weight: 600;">⏰ Important:</strong> This code will expire in <strong style="font-weight: 600;">${expiryMins} minutes</strong>. Please enter it promptly to complete your verification.
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0; font-family: 'Roboto', sans-serif;">
        If you didn't create an account with ${appName}, you can safely ignore this email.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 24px 30px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center; font-family: 'Roboto', sans-serif;">
        This is an automated email from ${appName}. Please do not reply to this message.
      </p>
      <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 8px 0 0; text-align: center; font-family: 'Roboto', sans-serif;">
        © ${new Date().getFullYear()} ${appName}. All rights reserved.
      </p>
    </div>
    
  </div>
</body>
</html>
  `;
  
  return sendEmail({ to, subject, text, html });
}

module.exports = {
  sendEmail,
  sendOtpEmail,
};
