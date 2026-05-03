/**
 * COMMUNICATION SERVICE
 * Handles email and SMS notifications securely
 */

import nodemailer from 'nodemailer';
// import twilio from 'twilio'; // Commented for demo
import { logger } from '../config/logger.js';

/**
 * Send verification email
 */
export async function sendVerificationEmail(email, token) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SERVICE_PASSWORD
      }
    });

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify Your Email - Election Assistant',
      html: `
        <h2>Welcome to Election Assistant!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>This link expires in 24 hours.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to ${email}`);
    return true;

  } catch (error) {
    logger.error('Failed to send verification email:', error);
    throw error;
  }
}

/**
 * Send OTP via SMS
 */
export async function sendOTPSMS(phoneNumber, otp) {
  try {
    // Placeholder - Implement with Twilio
    logger.info(`OTP sent to ${phoneNumber}: ${otp}`);
    
    // Uncomment when Twilio is configured:
    // const accountSid = process.env.TWILIO_ACCOUNT_SID;
    // const authToken = process.env.TWILIO_AUTH_TOKEN;
    // const client = twilio(accountSid, authToken);
    //
    // await client.messages.create({
    //   body: `Your Election Assistant OTP is: ${otp}. Valid for 10 minutes.`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber
    // });

    return true;

  } catch (error) {
    logger.error('Failed to send OTP SMS:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email, token) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SERVICE_PASSWORD
      }
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset Your Password - Election Assistant',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
    return true;

  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    throw error;
  }
}

/**
 * Send election reminder
 */
export async function sendElectionReminder(email, reminderType) {
  try {
    const reminderMessages = {
      registration: 'Don\'t forget to register to vote!',
      campaign: 'Campaign period is ongoing - learn about the candidates',
      voting: 'Election Day is here! Go cast your vote',
      results: 'Election results are being announced'
    };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SERVICE_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Election Reminder - ${reminderMessages[reminderType]}`,
      html: `
        <h2>Election Assistant Reminder</h2>
        <p>${reminderMessages[reminderType]}</p>
        <p><a href="${process.env.FRONTEND_URL}">Go to Election Assistant</a></p>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Reminder email sent to ${email} for type: ${reminderType}`);
    return true;

  } catch (error) {
    logger.error('Failed to send election reminder:', error);
    throw error;
  }
}
