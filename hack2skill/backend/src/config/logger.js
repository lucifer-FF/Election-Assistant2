/**
 * LOGGING CONFIGURATION
 * Winston logger with file and console transports
 * Audit logging for compliance and security monitoring
 */

import winston from 'winston';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ========== WINSTON LOGGER ==========
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'election-assistant-api' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: process.env.LOG_FILE ? process.env.LOG_FILE.replace('.log', '-error.log') : 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Combined logs
    new winston.transports.File({
      filename: process.env.LOG_FILE || 'logs/app.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// ========== MORGAN HTTP LOGGER ==========
export const morganMiddleware = morgan((tokens, req, res) => {
  return JSON.stringify({
    timestamp: tokens.date(req, res, 'iso'),
    method: tokens.method(req, res),
    path: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: tokens['response-time'](req, res),
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous'
  });
}, {
  stream: {
    write: (message) => {
      logger.info(JSON.parse(message));
    }
  },
  skip: (req) => {
    return req.path === '/api/health';
  }
});

// ========== AUDIT LOGGER ==========
export function auditLogger(action, userId, details = {}) {
  const auditEntry = {
    timestamp: new Date(),
    action,
    userId,
    ...details
  };

  logger.info('AUDIT_LOG', auditEntry);

  // Also write to separate audit log file
  const auditLogger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: process.env.AUDIT_LOG_FILE || 'logs/audit.log'
      })
    ]
  });

  auditLogger.info(auditEntry);
}

// ========== SECURITY EVENT LOGGER ==========
export function logSecurityEvent(eventType, severity, details = {}) {
  logger.warn('SECURITY_EVENT', {
    eventType,
    severity, // 'low', 'medium', 'high', 'critical'
    timestamp: new Date(),
    ...details
  });
}
