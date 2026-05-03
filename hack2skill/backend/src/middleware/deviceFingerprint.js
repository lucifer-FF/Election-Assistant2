/**
 * DEVICE FINGERPRINTING MIDDLEWARE
 * Identifies and tracks devices for security monitoring
 * Detects suspicious login patterns and account takeover attempts
 */

import crypto from 'crypto';
import { logger, logSecurityEvent } from '../config/logger.js';

/**
 * Generate device fingerprint from request headers and IP
 */
export function generateDeviceFingerprint(req) {
  const fingerprintData = {
    userAgent: req.get('user-agent') || 'unknown',
    acceptLanguage: req.get('accept-language') || 'unknown',
    acceptEncoding: req.get('accept-encoding') || 'unknown',
    ip: req.ip || req.socket.remoteAddress
  };

  const fingerprintString = JSON.stringify(fingerprintData);
  const fingerprint = crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex');

  return {
    fingerprint,
    components: fingerprintData
  };
}

/**
 * Device fingerprinting middleware
 * Attaches device information to request for tracking
 */
export function deviceFingerprint(req, res, next) {
  try {
    const deviceInfo = generateDeviceFingerprint(req);
    
    req.deviceFingerprint = deviceInfo.fingerprint;
    req.deviceInfo = deviceInfo.components;

    // Add to response headers for debugging (in development)
    if (process.env.NODE_ENV !== 'production') {
      res.set('X-Device-Fingerprint', deviceInfo.fingerprint);
    }

    next();

  } catch (error) {
    logger.error('Device fingerprinting error:', error);
    next(); // Continue despite error
  }
}

/**
 * Detect suspicious login patterns
 */
export function detectSuspiciousLogin(currentFingerprint, previousFingerprint) {
  // If different fingerprints, flag as suspicious
  if (currentFingerprint !== previousFingerprint) {
    return {
      suspicious: true,
      reason: 'Device fingerprint mismatch',
      requiresVerification: true
    };
  }

  return { suspicious: false };
}

/**
 * Validate device against known devices for user
 */
export async function validateKnownDevice(userId, deviceFingerprint, knownDevices = []) {
  const isKnown = knownDevices.some(device => 
    device.fingerprint === deviceFingerprint && !device.revoked
  );

  if (!isKnown) {
    logSecurityEvent('unknown_device_login_attempt', 'medium', {
      userId,
      deviceFingerprint,
      timestamp: new Date()
    });
  }

  return isKnown;
}
