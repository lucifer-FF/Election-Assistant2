/**
 * INPUT VALIDATION MIDDLEWARE
 * XSS protection, input sanitization, SQL injection prevention
 * Uses Joi for schema validation
 */

import Joi from 'joi';
import validator from 'validator';
import { logger, logSecurityEvent } from '../config/logger.js';

// Custom validation schemas
export const schemas = {
  // User Registration
  register: Joi.object({
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().min(12).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/)
      .messages({
        'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character'
      }),
    fullName: Joi.string().max(100).required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    state: Joi.string().required(),
    constituency: Joi.string().required()
  }),

  // User Login
  login: Joi.object({
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().required(),
    deviceId: Joi.string().optional()
  }),

  // Voter Verification
  voterVerification: Joi.object({
    voterId: Joi.string().uppercase().length(10).required(),
    partNo: Joi.string().numeric().required()
  }),

  // Polling Booth Search
  pollingBoothSearch: Joi.object({
    voterId: Joi.string().uppercase().length(10).required(),
    partNo: Joi.string().numeric().required(),
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional()
  }),

  // Reminder Setup
  reminderSetup: Joi.object({
    email: Joi.string().email().required().lowercase(),
    types: Joi.array().items(Joi.string().valid('registration', 'campaign', 'voting', 'results')).min(1),
    phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    enableSMS: Joi.boolean().default(false)
  }),

  // Chatbot Message
  chatbotMessage: Joi.object({
    message: Joi.string().max(1000).required(),
    conversationId: Joi.string().optional(),
    context: Joi.string().optional()
  })
};

/**
 * Generic input validation middleware factory
 * @param {Object} schema - Joi schema for validation
 */
export function validateInput(schema) {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        logSecurityEvent('validation_error', 'low', {
          errors: error.details.map(e => ({
            field: e.path.join('.'),
            message: e.message
          })),
          ip: req.ip
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      // Replace req.body with validated, sanitized data
      req.body = value;
      next();

    } catch (error) {
      logger.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Validation error'
      });
    }
  };
}

/**
 * Sanitize string input
 * Remove XSS, SQL injection attempts
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  // Remove potential XSS: <script>, onclick, etc.
  let sanitized = validator.escape(input);

  // Remove SQL injection attempts
  sanitized = sanitized.replace(/['";\\]/g, '');

  return sanitized.trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  return validator.isEmail(email);
}

/**
 * Validate voter ID format (India)
 */
export function isValidVoterId(voterId) {
  return /^[A-Z]{3}\d{7}$/.test(voterId.toUpperCase());
}

/**
 * Validate constituency code
 */
export function isValidConstituencyCode(code) {
  return /^\d{1,4}$/.test(code);
}

/**
 * Validate phone number (India)
 */
export function isValidPhoneNumber(phone) {
  return /^[0-9]{10}$/.test(phone.replace(/[\s\-]/g, ''));
}

/**
 * Validate Aadhar number
 */
export function isValidAadhar(aadhar) {
  return /^\d{12}$/.test(aadhar.replace(/[\s\-]/g, ''));
}
