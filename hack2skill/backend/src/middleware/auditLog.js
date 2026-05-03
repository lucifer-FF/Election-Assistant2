/**
 * AUDIT LOGGING MIDDLEWARE
 * Logs all user actions for compliance and security monitoring
 * Tracks state-changing operations
 */

import { auditLogger, logger } from '../config/logger.js';

const auditableActions = {
  'POST': ['create', 'register', 'login'],
  'PUT': ['update', 'modify'],
  'DELETE': ['delete', 'remove'],
  'PATCH': ['patch', 'update']
};

/**
 * Audit logging middleware
 * Logs all API actions with user context and request details
 */
export function auditLog(req, res, next) {
  // Store original send function
  const originalSend = res.send;

  // Override send function to log response
  res.send = function(data) {
    // Log the request/response
    if (shouldAuditRequest(req)) {
      const auditEntry = {
        timestamp: new Date(),
        method: req.method,
        path: req.path,
        userId: req.user?.id || 'anonymous',
        email: req.user?.email || null,
        ip: req.ip,
        statusCode: res.statusCode,
        deviceFingerprint: req.deviceFingerprint,
        requestBody: sanitizeAuditLog(req.body),
        userAgent: req.get('user-agent'),
        action: getActionName(req),
        resource: extractResourceInfo(req)
      };

      auditLogger(getActionName(req), req.user?.id || 'anonymous', {
        ...auditEntry,
        responseStatus: res.statusCode
      });

      // Alert on suspicious activities
      if (res.statusCode >= 400) {
        logger.warn('Audit: Suspicious activity detected', auditEntry);
      }
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Determine if request should be audited
 */
function shouldAuditRequest(req) {
  // Skip health checks and API docs
  if (['/api/health', '/api/docs'].includes(req.path)) {
    return false;
  }

  // Audit all state-changing operations
  return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
}

/**
 * Extract action name from request
 */
function getActionName(req) {
  const method = req.method;
  const parts = req.path.split('/').filter(p => p);
  
  if (method === 'POST') return `${parts[parts.length - 1]}_created`;
  if (method === 'PUT') return `${parts[parts.length - 1]}_updated`;
  if (method === 'DELETE') return `${parts[parts.length - 1]}_deleted`;
  if (method === 'PATCH') return `${parts[parts.length - 1]}_patched`;
  
  return 'unknown_action';
}

/**
 * Extract resource information from request
 */
function extractResourceInfo(req) {
  const parts = req.path.split('/').filter(p => p);
  return {
    resource: parts[1] || null,
    id: parts[2] || null
  };
}

/**
 * Remove sensitive data from audit logs
 * Password, API keys, tokens should never be logged
 */
function sanitizeAuditLog(body) {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'apiKey', 'token', 'secret', 'refreshToken', 'otp'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}
