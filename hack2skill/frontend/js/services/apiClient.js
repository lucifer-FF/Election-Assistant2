/**
 * API CLIENT SERVICE
 * Secure HTTP client with JWT authentication
 * Centralized API communication with error handling
 */

import { TokenManager } from './tokenManager.js';
import { SecurityManager } from '../managers/securityManager.js';

export class ApiClient {
  constructor() {
    this.baseUrl = window.APP_CONFIG.apiUrl;
    this.tokenManager = new TokenManager();
    this.securityManager = new SecurityManager();
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Make HTTP request with JWT auth
   * SECURITY: Auto-refresh tokens, error handling, request/response validation
   */
  async request(endpoint, options = {}) {
    const method = options.method || 'GET';
    const headers = this.buildHeaders(options.headers);
    const url = `${this.baseUrl}${endpoint}`;

    try {
      // Check if token needs refresh
      if (this.tokenManager.isTokenExpiringSoon()) {
        await this.tokenManager.refreshToken();
      }

      // Add Authorization header
      const token = this.tokenManager.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Add CSRF token if available
      const csrfToken = this.securityManager.getCSRFToken();
      if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        credentials: 'include', // Send cookies for session management
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle response
      return await this.handleResponse(response);

    } catch (error) {
      console.error(`API Error: ${method} ${endpoint}`, error);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      throw error;
    }
  }

  /**
   * Handle API response
   * Check status, validate JSON, handle errors
   */
  async handleResponse(response) {
    let data;

    try {
      data = await response.json();
    } catch (error) {
      // Response was not JSON
      data = { message: response.statusText };
    }

    // Success responses (2xx)
    if (response.ok) {
      return data;
    }

    // 401 Unauthorized - Token expired or invalid
    if (response.status === 401) {
      this.tokenManager.clearTokens();
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    // 403 Forbidden
    if (response.status === 403) {
      throw new Error(data.message || 'Access denied');
    }

    // 429 Too Many Requests - Rate limited
    if (response.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    }

    // 400/422 Validation error
    if (response.status === 400 || response.status === 422) {
      const errors = data.errors || [];
      const errorMessage = errors.length > 0 
        ? errors.map(e => `${e.field}: ${e.message}`).join('; ')
        : data.message || 'Validation failed';
      throw new Error(errorMessage);
    }

    // 500+ Server error
    if (response.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }

    throw new Error(data.message || `HTTP ${response.status}`);
  }

  /**
   * Build request headers
   */
  buildHeaders(customHeaders = {}) {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...customHeaders
    };
  }

  // ========== Convenience Methods ==========

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
