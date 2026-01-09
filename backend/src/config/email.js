const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // Use different transporter based on environment
        if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
            // Use Ethereal for testing in development
            this.setupEtherealTransporter();
        } else {
            // Use real email service
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        }
    }

    async setupEtherealTransporter() {
        try {
            // Create test account
            const testAccount = await nodemailer.createTestAccount();
            
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            
            console.log('Using Ethereal Email for testing');
            console.log('Test account:', testAccount.user);
        } catch (error) {
            console.error('Failed to create Ethereal account:', error);
            // Fallback to console logging
            this.transporter = null;
        }
    }

    async sendVerificationEmail(email, username, verificationToken) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'test@example.com',
            to: email,
            subject: 'Verify Your Discord Clone Account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #5865F2;">Welcome to Discord Clone!</h2>
                    <p>Hi ${username},</p>
                    <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #5865F2; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 4px; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p style="word-break: break-all; color: #5865F2;">${verificationUrl}</p>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you didn't create this account, please ignore this email.</p>
                </div>
            `
        };

        if (!this.transporter) {
            console.log('📧 Email would be sent to:', email);
            console.log('📧 Verification URL:', verificationUrl);
            return { messageId: 'console-log' };
        }

        const info = await this.transporter.sendMail(mailOptions);
        
        // If using Ethereal, log the preview URL
        if (process.env.NODE_ENV === 'development') {
            console.log('📧 Email sent to:', email);
            console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
        }
        
        return info;
    }

    async sendPasswordResetEmail(email, username, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset Your Discord Clone Password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #5865F2;">Password Reset Request</h2>
                    <p>Hi ${username},</p>
                    <p>You requested to reset your password. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #ED4245; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 4px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p style="word-break: break-all; color: #ED4245;">${resetUrl}</p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this password reset, please ignore this email.</p>
                </div>
            `
        };

        return await this.transporter.sendMail(mailOptions);
    }

    async sendPasswordChangeNotification(email, username) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Changed Successfully',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #57F287;">Password Changed Successfully</h2>
                    <p>Hi ${username},</p>
                    <p>Your password has been successfully changed.</p>
                    <p>If you didn't make this change, please contact support immediately.</p>
                    <p>Time: ${new Date().toLocaleString()}</p>
                </div>
            `
        };

        return await this.transporter.sendMail(mailOptions);
    }
}

const emailService = new EmailService();
module.exports = emailService;