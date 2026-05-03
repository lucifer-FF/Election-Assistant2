/**
 * AUTHENTICATION ROUTES
 * Public routes for registration, login, password reset
 */

import express from 'express';
import { validateInput, schemas } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import {
  register,
  verifyEmail,
  requestPhoneOTP,
  verifyPhoneOTP,
  login,
  refreshAccessToken,
  logout,
  requestPasswordReset,
  resetPassword
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/request-phone-otp', requestPhoneOTP);
router.post('/verify-phone-otp', verifyPhoneOTP);
router.post('/login', login);
router.post('/refresh-token', refreshAccessToken);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/logout', authenticate, logout);

export default router;
