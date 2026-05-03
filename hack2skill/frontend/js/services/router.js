/**
 * ROUTER
 * Client-side routing without page reloads
 * Manages navigation and component rendering
 */

export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.history = [];
  }

  /**
   * Register route
   */
  registerRoute(path, handler, meta = {}) {
    this.routes.set(path, { handler, meta });
  }

  /**
   * Initialize router
   * Set up event listeners for navigation
   */
  initialize() {
    // Handle popstate event (back/forward buttons)
    window.addEventListener('popstate', (e) => {
      this.handleNavigation(window.location.pathname, false);
    });

    // Handle link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="/"]');
      if (link) {
        e.preventDefault();
        this.navigate(link.href);
      }
    });

    // Load initial route
    this.handleNavigation(window.location.pathname);
  }

  /**
   * Navigate to route
   */
  navigate(path, state = {}) {
    window.history.pushState(state, '', path);
    this.handleNavigation(path, true);
  }

  /**
   * Handle navigation
   */
  async handleNavigation(path, addToHistory = true) {
    const route = this.routes.get(path);

    if (!route) {
      // Route not found, show 404
      this.show404();
      return;
    }

    try {
      // Check if route requires authentication
      if (route.meta.requiresAuth) {
        const { AuthManager } = await import('../managers/authManager.js');
        const authManager = new AuthManager();

        if (!authManager.isAuthenticated()) {
          this.navigate('/login');
          return;
        }
      }

      // Render route
      const container = document.getElementById('root');
      container.innerHTML = ''; // Clear previous content

      if (typeof route.handler === 'function') {
        await route.handler(container);
      }

      this.currentRoute = path;

      if (addToHistory) {
        this.history.push(path);
      }

    } catch (error) {
      console.error('Navigation error:', error);
      this.show500();
    }
  }

  /**
   * Show 404 page
   */
  show404() {
    const container = document.getElementById('root');
    container.innerHTML = `
      <div class="error-page">
        <h1>404</h1>
        <p>Page not found</p>
        <a href="/" class="btn btn-primary">Go Home</a>
      </div>
    `;
  }

  /**
   * Show 500 error page
   */
  show500() {
    const container = document.getElementById('root');
    container.innerHTML = `
      <div class="error-page">
        <h1>500</h1>
        <p>An error occurred</p>
        <a href="/" class="btn btn-primary">Go Home</a>
      </div>
    `;
  }

  /**
   * Go back in history
   */
  back() {
    window.history.back();
  }

  /**
   * Go forward in history
   */
  forward() {
    window.history.forward();
  }

  /**
   * Get current route
   */
  getCurrentRoute() {
    return this.currentRoute;
  }
}

// Export singleton instance
export const router = new Router();
