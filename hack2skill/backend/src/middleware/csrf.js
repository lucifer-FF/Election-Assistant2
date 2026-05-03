/**
 * CSRF PROTECTION MIDDLEWARE
 * Token-based CSRF protection for state-changing operations
 * Prevents Cross-Site Request Forgery attacks
 */

import crypto from 'crypto';
import { logger, logSecurityEvent } from '../config/logger.js';

const csrfTokenStore = new Map();

/**
 * Generate CSRF token for session
 */
export function generateCSRFToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokenStore.set(sessionId, token);
  
  // Auto-expire token after 1 hour
  setTimeout(() => {
    csrfTokenStore.delete(sessionId);
  }, 3600000);

  return token;
}

/**
 * CSRF Protection middleware
 * Validates CSRF tokens on state-changing requests (POST, PUT, DELETE)
 */
export function csrfProtection(req, res, next) {
  // Skip CSRF check for GET requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  try {
    if (process.env.CSRF_PROTECTION === 'false') {
      return next(); // Allow disabling for testing
    }

    const sessionId = req.sessionID || req.user?.id;
    const csrfTokenHeader = req.headers['x-csrf-token'] || req.body._csrf;
    const storedToken = csrfTokenStore.get(sessionId);

    if (!csrfTokenHeader || !storedToken || csrfTokenHeader !== storedToken) {
      logSecurityEvent('csrf_token_mismatch', 'high', {
        userId: req.user?.id,
        method: req.method,
        path: req.path,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        message: 'CSRF token validation failed',
        code: 'CSRF_TOKEN_INVALID'
      });
    }

    // Token is valid, proceed
    next();

  } catch (error) {
    logger.error('CSRF protection error:', error);
    res.status(500).json({
      success: false,
      message: 'CSRF validation error'
    });
  }
}

/**
 * Middleware to provide CSRF token to client
 */
export function setCSRFToken(req, res, next) {
  const sessionId = req.sessionID || req.user?.id;
  if (sessionId) {
    res.locals.csrfToken = generateCSRFToken(sessionId);
  }
  next();
}
