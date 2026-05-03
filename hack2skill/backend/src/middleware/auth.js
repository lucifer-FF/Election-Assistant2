/**
 * AUTHENTICATION MIDDLEWARE
 * JWT token verification, refresh token rotation, session management
 * Role-Based Access Control (RBAC)
 */

import jwt from 'jsonwebtoken';
import { logger, logSecurityEvent } from '../config/logger.js';

/**
 * Verify JWT token and attach user to request
 * SECURITY: Token validation, expiry checking, signature verification
 */
export function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      logSecurityEvent('auth_missing_token', 'medium', {
        ip: req.ip,
        path: req.path
      });
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    // Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user data to request
    req.user = decoded;
    req.token = token;

    logger.debug(`User authenticated: ${decoded.id} (${decoded.email})`);
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logSecurityEvent('auth_token_expired', 'low', {
        ip: req.ip,
        email: req.body?.email
      });
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      logSecurityEvent('auth_invalid_token', 'high', {
        ip: req.ip,
        error: error.message
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}

/**
 * Role-Based Access Control (RBAC)
 * Middleware for authorizing users based on roles
 */
export function authorize(allowedRoles = []) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: User not authenticated'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        logSecurityEvent('auth_insufficient_privileges', 'high', {
          userId: req.user.id,
          requiredRole: allowedRoles,
          userRole: req.user.role,
          path: req.path
        });

        return res.status(403).json({
          success: false,
          message: 'Forbidden: Insufficient privileges',
          requiredRole: allowedRoles,
          userRole: req.user.role
        });
      }

      next();

    } catch (error) {
      logger.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
}

/**
 * Check if user is admin
 */
export function isAdmin(req, res, next) {
  return authorize(['admin'])(req, res, next);
}

/**
 * Check if user owns the resource
 */
export function isOwner(resourceUserId) {
  return (req, res, next) => {
    if (req.user.id !== resourceUserId && req.user.role !== 'admin') {
      logSecurityEvent('auth_unauthorized_access_attempt', 'high', {
        userId: req.user.id,
        targetResourceUserId: resourceUserId,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this resource'
      });
    }
    next();
  };
}
