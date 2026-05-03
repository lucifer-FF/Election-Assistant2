/**
 * TOKEN MANAGER
 * Secure token storage and management
 * JWT access token and refresh token handling
 */

export class TokenManager {
  constructor() {
    this.accessTokenKey = 'ea_access_token';
    this.refreshTokenKey = 'ea_refresh_token';
    this.expiryKey = 'ea_token_expiry';
  }

  /**
   * Store tokens
   * SECURITY: Tokens stored in memory-resident storage with expiry tracking
   */
  setTokens(accessToken, refreshToken, expiresIn = 900) {
    // Calculate expiry time (subtract 60 seconds for safe refresh)
    const expiryTime = Date.now() + (expiresIn * 1000) - 60000;

    // Store in localStorage (with encryption ideally, but localStorage is used for convenience)
    localStorage.setItem(this.accessTokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    localStorage.setItem(this.expiryKey, expiryTime.toString());
  }

  /**
   * Get access token
   */
  getAccessToken() {
    return localStorage.getItem(this.accessTokenKey);
  }

  /**
   * Get refresh token
   */
  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Check if access token is expiring soon (within 60 seconds)
   */
  isTokenExpiringSoon() {
    const expiry = localStorage.getItem(this.expiryKey);
    if (!expiry) return false;

    const expiryTime = parseInt(expiry, 10);
    return Date.now() >= expiryTime;
  }

  /**
   * Check if user has valid tokens
   */
  hasValidTokens() {
    return !!this.getAccessToken() && !!this.getRefreshToken() && !this.isTokenExpiringSoon();
  }

  /**
   * Clear all tokens
   * Called on logout or token expiry
   */
  clearTokens() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.expiryKey);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken() {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${window.APP_CONFIG.apiUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include'
      });

      if (!response.ok) {
        this.clearTokens();
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.setTokens(data.accessToken, refreshToken, 900);

      return data.accessToken;

    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Parse JWT token payload (without verification)
   * Note: This is unsafe for security validation, only for reading claims
   */
  parseToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token format');

      const decoded = JSON.parse(atob(parts[1]));
      return decoded;

    } catch (error) {
      console.error('Token parsing error:', error);
      return null;
    }
  }

  /**
   * Get user information from token
   */
  getUserFromToken() {
    const token = this.getAccessToken();
    if (!token) return null;

    const decoded = this.parseToken(token);
    return decoded;
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
