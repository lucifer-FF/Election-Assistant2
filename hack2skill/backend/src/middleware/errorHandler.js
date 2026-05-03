/**
 * ERROR HANDLING MIDDLEWARE
 * Centralized error handling, async error wrapper
 * Consistent error responses across the API
 */

import { logger } from '../config/logger.js';

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.timestamp = new Date();
    this.path = null;
    this.requestId = null;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 * MUST be last middleware in chain
 */
export function errorHandler(err, req, res, next) {
  const error = {
    success: false,
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    path: req.originalUrl
  };

  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    error.stack = err.stack;
  }

  // Log error details
  if (error.statusCode >= 500) {
    logger.error('Server Error:', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id
    });
  } else {
    logger.warn('Client Error:', {
      error: err.message,
      statusCode: error.statusCode,
      url: req.originalUrl,
      ip: req.ip
    });
  }

  // Send error response
  res.status(error.statusCode).json(error);
}

/**
 * Validation error response formatter
 */
export function validationError(message, errors = []) {
  const error = new AppError(message, 400);
  error.errors = errors;
  return error;
}

/**
 * Authentication error response
 */
export function authenticationError(message = 'Authentication failed') {
  return new AppError(message, 401);
}

/**
 * Authorization error response
 */
export function authorizationError(message = 'Access denied') {
  return new AppError(message, 403);
}

/**
 * Not found error response
 */
export function notFoundError(resource = 'Resource') {
  return new AppError(`${resource} not found`, 404);
}

/**
 * Conflict error response (e.g., duplicate email)
 */
export function conflictError(message = 'Resource already exists') {
  return new AppError(message, 409);
}

/**
 * Rate limit error response
 */
export function rateLimitError(message = 'Too many requests') {
  return new AppError(message, 429);
}
