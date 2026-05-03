/**
 * MAIN APPLICATION FILE
 * Secure, modular frontend application
 * Component-based architecture with proper state management
 */

import { AuthManager } from './managers/authManager.js';
import { Router } from './services/router.js';
import { StateManager } from './services/stateManager.js';
import { UIManager } from './managers/uiManager.js';
import { SecurityManager } from './managers/securityManager.js';

// Initialize application
class ElectionAssistantApp {
  constructor() {
    this.authManager = new AuthManager();
    this.stateManager = new StateManager();
    this.uiManager = new UIManager();
    this.securityManager = new SecurityManager();
    this.router = new Router();
  }

  async initialize() {
    console.log('🚀 Initializing Election Assistant...');

    try {
      // Check HTTPS in production
      if (window.location.protocol !== 'https:' && window.APP_CONFIG.env === 'production') {
        console.warn('⚠️  HTTPS required in production');
      }

      // Initialize security
      await this.securityManager.initialize();

      // Check authentication status
      const isAuthenticated = await this.authManager.checkAuthStatus();

      if (isAuthenticated) {
        // Load user data
        await this.stateManager.loadUserData();
        this.router.navigate('/dashboard');
      } else {
        // Show login page
        this.router.navigate('/login');
      }

      // Initialize router
      this.router.initialize();

      // Setup event listeners
      this.setupEventListeners();

      console.log('✅ Application initialized successfully');

    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      this.uiManager.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  setupEventListeners() {
    // Handle online/offline
    window.addEventListener('online', () => {
      this.uiManager.showSuccess('Connection restored');
    });

    window.addEventListener('offline', () => {
      this.uiManager.showWarning('You are offline');
    });

    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // App is in background
        console.log('App backgrounded');
      } else {
        // App is in foreground - refresh session
        this.authManager.refreshSession();
      }
    });

    // Security: Log out on tab close
    window.addEventListener('beforeunload', () => {
      if (this.authManager.isAuthenticated()) {
        // Optionally log out
      }
    });
  }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new ElectionAssistantApp();
  app.initialize();
  
  // Expose for debugging (only in development)
  if (window.APP_CONFIG.env === 'development') {
    window.__APP__ = app;
  }
});
