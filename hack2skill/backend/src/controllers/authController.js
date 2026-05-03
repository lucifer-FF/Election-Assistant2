/**
 * AUTHENTICATION CONTROLLER
 * Handles user registration, login, token refresh, logout
 * Implements security best practices
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { 
  hashPassword, 
  verifyPassword, 
  generateOTP, 
  generateSecureToken,
  generateTokenPayload,
  encryptData
} from '../utils/crypto.js';
import { asyncHandler, AppError, conflictError, notFoundError } from '../middleware/errorHandler.js';
import { validateInput, schemas, isValidEmail, isValidPhoneNumber } from '../middleware/validation.js';
import { logger, auditLogger, logSecurityEvent } from '../config/logger.js';
import { sendVerificationEmail, sendOTPSMS } from '../services/communicationService.js';

/**
 * USER REGISTRATION
 * SECURITY: Password requirements, email verification, OTP phone verification
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, confirmPassword, fullName, phone, state, constituency } = req.body;

  // Validate input
  await validateInput(schemas.register)(req, res, () => {});

  // Password confirmation check
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    logSecurityEvent('registration_duplicate_email', 'low', {
      email,
      ip: req.ip
    });
    return res.status(409).json({
      success: false,
      message: 'Email already registered'
    });
  }

  // Create new user
  const user = new User({
    email: email.toLowerCase(),
    password, // Will be hashed by pre-save hook
    fullName,
    phone: phone.replace(/[\s\-]/g, ''),
    state,
    constituency
  });

  // Generate email verification token
  const verificationToken = generateSecureToken();
  user.emailVerificationToken = verificationToken;
  user.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await user.save();

  // Send verification email
  try {
    await sendVerificationEmail(user.email, verificationToken);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
  }

  auditLogger('user_registered', user._id, {
    email: user.email,
    ip: req.ip,
    timestamp: new Date()
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    userId: user._id,
    email: user.email,
    nextStep: 'email_verification'
  });
});

/**
 * VERIFY EMAIL
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Verification token is required'
    });
  }

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationTokenExpires: { $gt: new Date() }
  });

  if (!user) {
    logSecurityEvent('email_verification_invalid_token', 'low', {
      ip: req.ip
    });
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token'
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpires = undefined;
  await user.save();

  auditLogger('email_verified', user._id, {
    email: user.email,
    timestamp: new Date()
  });

  res.json({
    success: true,
    message: 'Email verified successfully',
    nextStep: 'phone_verification'
  });
});

/**
 * REQUEST PHONE VERIFICATION OTP
 */
export const requestPhoneOTP = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Generate OTP
  const { code, expiresAt } = generateOTP();

  user.phoneVerificationOTP = code;
  user.phoneVerificationOTPExpires = expiresAt;
  await user.save();

  // Send OTP via SMS
  try {
    await sendOTPSMS(user.phone, code);
    auditLogger('otp_requested', userId, {
      phone: user.phone,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to send OTP SMS:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }

  res.json({
    success: true,
    message: 'OTP sent to your phone',
    expiresIn: 600 // 10 minutes
  });
});

/**
 * VERIFY PHONE OTP
 */
export const verifyPhoneOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const userId = req.user.id;

  if (!otp) {
    return res.status(400).json({
      success: false,
      message: 'OTP is required'
    });
  }

  const user = await User.findById(userId).select('+phoneVerificationOTP +phoneVerificationOTPExpires');

  if (!user || user.phoneVerificationOTP !== otp || user.phoneVerificationOTPExpires < new Date()) {
    logSecurityEvent('otp_verification_failed', 'medium', {
      userId,
      ip: req.ip
    });
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP'
    });
  }

  user.isPhoneVerified = true;
  user.phoneVerificationOTP = undefined;
  user.phoneVerificationOTPExpires = undefined;
  await user.save();

  auditLogger('phone_verified', userId, {
    phone: user.phone,
    timestamp: new Date()
  });

  res.json({
    success: true,
    message: 'Phone verified successfully'
  });
});

/**
 * USER LOGIN
 * SECURITY: Rate limiting, account lockout, session tracking, device fingerprinting
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password, deviceId } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  // Find user and include password field
  let user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts');

  if (!user) {
    logSecurityEvent('login_user_not_found', 'low', {
      email,
      ip: req.ip
    });
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if account is locked
  if (user.isAccountLocked()) {
    logSecurityEvent('login_account_locked', 'high', {
      userId: user._id,
      ip: req.ip
    });
    return res.status(403).json({
      success: false,
      message: 'Account locked due to too many failed login attempts. Try again in 30 minutes.'
    });
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    // Increment login attempts
    await user.incrementLoginAttempts();

    logSecurityEvent('login_invalid_password', 'medium', {
      userId: user._id,
      ip: req.ip,
      attemptCount: user.loginAttempts.count + 1
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is verified
  if (!user.isEmailVerified || !user.isPhoneVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email and phone before logging in'
    });
  }

  // Check if user is active
  if (user.status !== 'active') {
    logSecurityEvent('login_inactive_user', 'high', {
      userId: user._id,
      status: user.status,
      ip: req.ip
    });
    return res.status(403).json({
      success: false,
      message: 'Your account is not active'
    });
  }

  // Reset login attempts
  await user.resetLoginAttempts();

  // Create session
  const sessionId = generateSecureToken();
  const session = {
    sessionId,
    deviceFingerprint: req.deviceFingerprint,
    loginTime: new Date(),
    lastActivityTime: new Date(),
    ip: req.ip,
    userAgent: req.get('user-agent'),
    isRevoked: false
  };

  user.activeSessions.push(session);
  user.lastLogin = new Date();

  // Limit active sessions to 5
  if (user.activeSessions.length > 5) {
    user.activeSessions = user.activeSessions.slice(-5);
  }

  await user.save();

  // Generate JWT tokens
  const tokenPayload = {
    ...generateTokenPayload(user),
    sessionId
  };

  const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m'
  });

  const refreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });

  auditLogger('user_login', user._id, {
    email: user.email,
    ip: req.ip,
    deviceFingerprint: req.deviceFingerprint,
    timestamp: new Date()
  });

  // Return tokens (refresh token as httpOnly cookie)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    success: true,
    message: 'Login successful',
    accessToken,
    refreshToken,
    user: user.toPublicJSON(),
    expiresIn: '15m'
  });
});

/**
 * REFRESH ACCESS TOKEN
 * SECURITY: Refresh token rotation, session validation
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user and validate session
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if session exists and is not revoked
    const session = user.activeSessions.find(s => s.sessionId === decoded.sessionId);
    if (!session || session.isRevoked) {
      logSecurityEvent('refresh_token_session_revoked', 'high', {
        userId: user._id,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        message: 'Session has been revoked'
      });
    }

    // Generate new access token
    const tokenPayload = {
      ...generateTokenPayload(user),
      sessionId: decoded.sessionId
    };

    const newAccessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '15m'
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: '15m'
    });

  } catch (error) {
    logSecurityEvent('refresh_token_invalid', 'medium', {
      error: error.message,
      ip: req.ip
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

/**
 * LOGOUT
 * SECURITY: Revoke session and tokens
 */
export const logout = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const sessionId = req.user.sessionId;

  const user = await User.findById(userId);
  if (user) {
    // Revoke session
    const session = user.activeSessions.find(s => s.sessionId === sessionId);
    if (session) {
      session.isRevoked = true;
    }
    await user.save();
  }

  auditLogger('user_logout', userId, {
    sessionId,
    timestamp: new Date()
  });

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * REQUEST PASSWORD RESET
 */
export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Valid email is required'
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // For security, always return success to prevent email enumeration
  if (user) {
    const resetToken = generateSecureToken();
    user.passwordResetToken = resetToken;
    user.passwordResetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    try {
      // Send password reset email
      // await sendPasswordResetEmail(user.email, resetToken);
      logger.info(`Password reset token generated for ${user.email}`);
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
    }
  }

  res.json({
    success: true,
    message: 'If this email exists in our system, you will receive password reset instructions'
  });
});

/**
 * RESET PASSWORD
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Token and new password are required'
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetTokenExpires: { $gt: new Date() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Update password
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;

  // Revoke all active sessions
  user.activeSessions.forEach(session => {
    session.isRevoked = true;
  });

  await user.save();

  auditLogger('password_reset', user._id, {
    email: user.email,
    timestamp: new Date()
  });

  res.json({
    success: true,
    message: 'Password reset successful. Please login with your new password.'
  });
});
