// server/services/OTPService.js
// CREATE THIS NEW FILE

const nodemailer = require("nodemailer");
const twilio = require("twilio");
const crypto = require("crypto");

class OTPService {
  constructor() {
    // Email configuration
    this.emailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // For development only - ignore self-signed cert errors
      tls: {
        rejectUnauthorized: false
      }
    });

    // SMS configuration (Twilio)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }

    // For development - use mock service
    this.isProduction = process.env.NODE_ENV === "production";
  }

  generateOTP() {
    // Generate 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendEmailOTP(email, otp, name = "") {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bookora - Email Verification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #eab308 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
            .otp-code { font-size: 32px; font-weight: bold; color: #eab308; text-align: center; letter-spacing: 5px; padding: 20px; background: white; border-radius: 10px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #eab308; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
            .warning { color: #ef4444; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏨 Bookora</h1>
              <p style="color: #fff3e0; margin: 5px 0 0;">Your Journey, Our Hospitality</p>
            </div>
            <div class="content">
              <h2>Hello ${name || "there"}! 👋</h2>
              <p>Thank you for choosing <strong>Bookora</strong>. Please use the following verification code to complete your registration:</p>
              
              <div class="otp-code">
                ${otp}
              </div>
              
              <p>This OTP is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.</p>
              
              <p>If you didn't request this code, you can safely ignore this email.</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <p style="font-size: 14px;">Need help? Contact our 24/7 support at <a href="mailto:support@bookora.com">support@bookora.com</a></p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Bookora. All rights reserved.</p>
              <p>Experience luxury stays at the best prices.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
        Bookora - Email Verification
        
        Hello ${name || "there"}! 👋
        
        Your verification code is: ${otp}
        
        This OTP is valid for 10 minutes. Please do not share this code with anyone.
        
        If you didn't request this code, please ignore this email.
        
        Need help? Contact us at support@bookora.com
        
        © 2024 Bookora. All rights reserved.
      `;

      // In development mode, log the OTP
      if (!this.isProduction) {
        console.log(`\n📧 ===== EMAIL OTP =====`);
        console.log(`To: ${email}`);
        console.log(`OTP: ${otp}`);
        console.log(`Valid for: 10 minutes`);
        console.log(`=====================\n`);
        
        // Still try to send email in development (works with ethereal)
        if (process.env.EMAIL_USER === "test") {
          return { success: true, sent: false, otp: otp, mode: "development" };
        }
      }

      // Send real email in production
      const info = await this.emailTransporter.sendMail({
        from: `"Bookora" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: "Bookora - Email Verification Code",
        text: textContent,
        html: htmlContent,
      });

      console.log(`Email sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Email send error:", error);
      // Don't fail in development
      if (!this.isProduction) {
        console.log(`⚠️ Email would have been sent in production. OTP: ${otp}`);
        return { success: true, sent: false, otp: otp, mode: "development_fallback" };
      }
      throw error;
    }
  }

  async sendSMSOTP(phoneNumber, otp) {
    try {
      // Clean phone number
      let cleanPhone = phoneNumber.toString().replace(/\D/g, '');
      
      // Add country code if not present (default to +91 for India)
      if (cleanPhone.length === 10) {
        cleanPhone = `+91${cleanPhone}`;
      } else if (!cleanPhone.startsWith('+')) {
        cleanPhone = `+${cleanPhone}`;
      }

      // In development mode, log the OTP
      if (!this.isProduction) {
        console.log(`\n📱 ===== SMS OTP =====`);
        console.log(`To: ${cleanPhone}`);
        console.log(`OTP: ${otp}`);
        console.log(`Valid for: 10 minutes`);
        console.log(`=====================\n`);
        return { success: true, sent: false, otp: otp, mode: "development" };
      }

      // Send real SMS in production
      if (!this.twilioClient) {
        throw new Error("Twilio client not configured");
      }

      const message = await this.twilioClient.messages.create({
        body: `🏨 Bookora: Your verification code is ${otp}. Valid for 10 minutes. DO NOT share this code with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: cleanPhone,
      });

      console.log(`SMS sent: ${message.sid}`);
      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error("SMS send error:", error);
      
      // Don't fail in development
      if (!this.isProduction) {
        console.log(`⚠️ SMS would have been sent in production. OTP: ${otp}`);
        return { success: true, sent: false, otp: otp, mode: "development_fallback" };
      }
      throw error;
    }
  }

  async sendOTP(identifier, type, name = "") {
    const otp = this.generateOTP();
    
    if (type === "email") {
      await this.sendEmailOTP(identifier, otp, name);
    } else if (type === "phone") {
      await this.sendSMSOTP(identifier, otp);
    }
    
    return otp;
  }
}

module.exports = new OTPService();