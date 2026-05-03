/**
 * SECURITY MANAGER
 * Frontend security features and protections
 * CSRF tokens, XSS prevention, secure data handling
 */

import { generateSecureToken } from '../utils/crypto.js';

export class SecurityManager {
  constructor() {
    this.csrfToken = null;
    this.nonce = null;
  }

  async initialize() {
    // Generate CSRF token for this session
    this.csrfToken = this.generateCSRFToken();

    // Generate security nonce
    this.nonce = generateSecureToken(16);

    // Initialize CSP-related security
    this.setupSecurityHeaders();

    console.log('✅ Security manager initialized');
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken() {
    const token = generateSecureToken(32);
    sessionStorage.setItem('ea_csrf_token', token);
    return token;
  }

  /**
   * Get CSRF token
   */
  getCSRFToken() {
    if (!this.csrfToken) {
      this.csrfToken = sessionStorage.getItem('ea_csrf_token') || this.generateCSRFToken();
    }
    return this.csrfToken;
  }

  /**
   * Sanitize user input to prevent XSS
   */
  sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Sanitize HTML (remove dangerous tags)
   */
  sanitizeHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;

    // Remove script tags and event handlers
    const scripts = div.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // Remove event handlers from attributes
    const allElements = div.querySelectorAll('*');
    allElements.forEach(element => {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) {
          element.removeAttribute(attr.name);
        }
      });
    });

    return div.innerHTML;
  }

  /**
   * Setup security-related headers and policies
   */
  setupSecurityHeaders() {
    // HSTS (HTTP Strict Transport Security)
    if (window.location.protocol === 'https:' || window.APP_CONFIG.env === 'production') {
      // Tell browser to always use HTTPS
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Strict-Transport-Security';
      meta.content = 'max-age=31536000; includeSubDomains; preload';
      document.head.appendChild(meta);
    }

    // X-Content-Type-Options
    const noscript = document.createElement('meta');
    noscript.httpEquiv = 'X-Content-Type-Options';
    noscript.content = 'nosniff';
    document.head.appendChild(noscript);

    // X-Frame-Options (prevent clickjacking)
    const frame = document.createElement('meta');
    frame.httpEquiv = 'X-Frame-Options';
    frame.content = 'DENY';
    document.head.appendChild(frame);
  }

  /**
   * Check if connection is secure
   */
  isSecureConnection() {
    return window.location.protocol === 'https:' || 
           window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType, details = {}) {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...details
    };

    // In production, send to server for logging
    if (window.APP_CONFIG.env === 'production') {
      // Could send to analytics/logging service
      console.warn('Security Event:', event);
    } else {
      console.log('Security Event:', event);
    }
  }

  /**
   * Detect and prevent XSS attempts
   */
  detectXSSAttempt(input) {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /on\w+\s*=\s*["'][^"']*["']/gi,
      /javascript:/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        this.logSecurityEvent('xss_attempt_detected', { input: input.substring(0, 100) });
        return true;
      }
    }

    return false;
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;

    return {
      valid: score === 5,
      score,
      checks,
      strength: score === 5 ? 'strong' : score >= 4 ? 'good' : score >= 3 ? 'fair' : 'weak'
    };
  }

  /**
   * Hash password on client (not for security, just to avoid transmitting plain text in URLs)
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate random token
   */
  generateToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      token += chars[array[i] % chars.length];
    }

    return token;
  }
}

export const securityManager = new SecurityManager();
