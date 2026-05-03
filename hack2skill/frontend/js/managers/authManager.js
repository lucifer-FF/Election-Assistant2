/**
 * AUTHENTICATION MANAGER
 * User login, registration, logout
 * Session management and authentication state
 */

import { apiClient } from '../services/apiClient.js';
import { TokenManager } from '../services/tokenManager.js';
import { UIManager } from './uiManager.js';

export class AuthManager {
  constructor() {
    this.tokenManager = new TokenManager();
    this.uiManager = new UIManager();
    this.currentUser = null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.tokenManager.hasValidTokens();
  }

  /**
   * Check authentication status and load user data
   */
  async checkAuthStatus() {
    if (!this.isAuthenticated()) {
      return false;
    }

    // Parse user from token
    this.currentUser = this.tokenManager.getUserFromToken();
    return !!this.currentUser;
  }

  /**
   * User registration
   */
  async register(userData) {
    try {
      this.uiManager.showLoading(true);

      const response = await apiClient.post('/auth/register', {
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
        fullName: userData.fullName,
        phone: userData.phone,
        state: userData.state,
        constituency: userData.constituency
      });

      this.uiManager.showSuccess('Registration successful! Please check your email to verify your account.');
      return response;

    } catch (error) {
      this.uiManager.showError(error.message);
      throw error;

    } finally {
      this.uiManager.showLoading(false);
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token) {
    try {
      const response = await apiClient.post('/auth/verify-email', { token });
      this.uiManager.showSuccess('Email verified successfully!');
      return response;

    } catch (error) {
      this.uiManager.showError('Email verification failed: ' + error.message);
      throw error;
    }
  }

  /**
   * User login
   */
  async login(email, password) {
    try {
      this.uiManager.showLoading(true);

      const response = await apiClient.post('/auth/login', {
        email,
        password,
        deviceId: this.getDeviceId()
      });

      // Store tokens
      this.tokenManager.setTokens(
        response.accessToken,
        response.refreshToken,
        900 // 15 minutes
      );

      // Store user data
      this.currentUser = response.user;
      localStorage.setItem('ea_user', JSON.stringify(response.user));

      this.uiManager.showSuccess('Login successful!');
      return response.user;

    } catch (error) {
      this.uiManager.showError('Login failed: ' + error.message);
      throw error;

    } finally {
      this.uiManager.showLoading(false);
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      // Attempt to logout on server
      if (this.isAuthenticated()) {
        await apiClient.post('/auth/logout', {});
      }

    } catch (error) {
      console.warn('Logout API error (continuing):', error);

    } finally {
      // Clear local data regardless of API response
      this.tokenManager.clearTokens();
      localStorage.removeItem('ea_user');
      this.currentUser = null;

      this.uiManager.showSuccess('Logged out successfully');
      window.location.href = '/login';
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      this.uiManager.showSuccess('Password reset instructions sent to your email');
      return response;

    } catch (error) {
      this.uiManager.showError('Password reset request failed: ' + error.message);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword, confirmPassword) {
    try {
      this.uiManager.showLoading(true);

      const response = await apiClient.post('/auth/reset-password', {
        token,
        newPassword,
        confirmPassword
      });

      this.uiManager.showSuccess('Password reset successful! Please login with your new password.');
      return response;

    } catch (error) {
      this.uiManager.showError('Password reset failed: ' + error.message);
      throw error;

    } finally {
      this.uiManager.showLoading(false);
    }
  }

  /**
   * Refresh session
   */
  async refreshSession() {
    try {
      await this.tokenManager.refreshToken();
      console.log('Session refreshed');

    } catch (error) {
      console.warn('Session refresh failed:', error);
      // Redirect to login
      window.location.href = '/login';
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    if (!this.currentUser) {
      const stored = localStorage.getItem('ea_user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    }
    return this.currentUser;
  }

  /**
   * Generate device ID for device fingerprinting
   */
  getDeviceId() {
    let deviceId = localStorage.getItem('ea_device_id');

    if (!deviceId) {
      // Generate new device ID
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('ea_device_id', deviceId);
    }

    return deviceId;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.hasRole('admin');
  }
}
