/**
 * USER MODEL (Mongoose Schema)
 * Secure user data storage with encrypted fields
 * Password hashing on save, automatic timestamps
 */

import mongoose from 'mongoose';
import { hashPassword } from '../utils/crypto.js';
import { logger } from '../config/logger.js';

const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 12,
    select: false // Don't include password by default
  },

  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: 100
  },

  // Contact Information
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },

  // Election Information
  state: {
    type: String,
    required: [true, 'State is required']
  },

  constituency: {
    type: String,
    required: [true, 'Constituency is required']
  },

  voterId: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    match: [/^[A-Z]{3}\d{7}$/, 'Invalid voter ID format']
  },

  partNo: {
    type: String,
    sparse: true
  },

  // Security & Status
  role: {
    type: String,
    enum: ['voter', 'poll_officer', 'admin'],
    default: 'voter'
  },

  isEmailVerified: {
    type: Boolean,
    default: false
  },

  isPhoneVerified: {
    type: Boolean,
    default: false
  },

  emailVerificationToken: {
    type: String,
    select: false
  },

  emailVerificationTokenExpires: Date,

  phoneVerificationOTP: {
    type: String,
    select: false
  },

  phoneVerificationOTPExpires: Date,

  // Password Reset
  passwordResetToken: {
    type: String,
    select: false
  },

  passwordResetTokenExpires: Date,

  lastPasswordChange: Date,

  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },

  twoFactorSecret: {
    type: String,
    select: false
  },

  // Session Management
  activeSessions: [{
    sessionId: String,
    deviceFingerprint: String,
    loginTime: Date,
    lastActivityTime: Date,
    ip: String,
    userAgent: String,
    isRevoked: { type: Boolean, default: false }
  }],

  // Preferences
  preferences: {
    reminderEmail: Boolean,
    reminderSMS: Boolean,
    newsSubscription: Boolean,
    language: { type: String, default: 'en' },
    darkMode: { type: Boolean, default: false }
  },

  // Security Metadata
  loginAttempts: {
    count: { type: Number, default: 0 },
    lastAttempt: Date,
    lockedUntil: Date
  },

  // Audit Trail
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  lastLogin: Date,

  status: {
    type: String,
    enum: ['active', 'suspended', 'deactivated'],
    default: 'active'
  }

}, {
  timestamps: true,
  collection: 'users'
});

// ============================================================
// INDEXES - For performance optimization
// ============================================================

userSchema.index({ email: 1 });
userSchema.index({ voterId: 1 }, { sparse: true });
userSchema.index({ state: 1, constituency: 1 });
userSchema.index({ createdAt: -1 });

// ============================================================
// PRE-SAVE HOOKS - Security
// ============================================================

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await hashPassword(this.password);
    this.lastPasswordChange = new Date();
    next();
  } catch (error) {
    logger.error('Password hashing error:', error);
    next(error);
  }
});

// Update updatedAt timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ============================================================
// METHODS
// ============================================================

/**
 * Compare provided password with stored hash
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  const { verifyPassword } = await import('../utils/crypto.js');
  return verifyPassword(candidatePassword, this.password);
};

/**
 * Check if account is locked due to too many login attempts
 */
userSchema.methods.isAccountLocked = function() {
  return this.loginAttempts.lockedUntil && this.loginAttempts.lockedUntil > new Date();
};

/**
 * Increment login attempt counter
 */
userSchema.methods.incrementLoginAttempts = async function() {
  // Reset attempts if lock time has passed
  if (this.loginAttempts.lockedUntil && this.loginAttempts.lockedUntil < new Date()) {
    return this.updateOne({
      $set: { 'loginAttempts.count': 1, 'loginAttempts.lastAttempt': new Date() },
      $unset: { 'loginAttempts.lockedUntil': 1 }
    });
  }

  // Otherwise increment
  const updates = {
    'loginAttempts.count': this.loginAttempts.count + 1,
    'loginAttempts.lastAttempt': new Date()
  };

  // Lock account after 5 failed attempts for 30 minutes
  if (this.loginAttempts.count + 1 >= 5) {
    updates['loginAttempts.lockedUntil'] = new Date(Date.now() + 30 * 60 * 1000);
  }

  return this.updateOne({ $set: updates });
};

/**
 * Reset login attempts
 */
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $set: {
      'loginAttempts.count': 0,
      'loginAttempts.lastAttempt': null
    },
    $unset: { 'loginAttempts.lockedUntil': 1 }
  });
};

/**
 * Get public profile (safe data for API responses)
 */
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.passwordResetToken;
  delete user.emailVerificationToken;
  delete user.phoneVerificationOTP;
  delete user.twoFactorSecret;
  delete user.activeSessions;
  return user;
};

export default mongoose.model('User', userSchema);
