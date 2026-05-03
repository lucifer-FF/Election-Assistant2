/**
 * STATE MANAGER
 * Centralized application state management
 * User data, election information, app preferences
 */

export class StateManager {
  constructor() {
    this.state = {
      user: null,
      elections: [],
      candidates: [],
      pollingBooths: [],
      reminders: [],
      preferences: {
        language: localStorage.getItem('ea_language') || 'en',
        darkMode: localStorage.getItem('ea_darkMode') === 'true',
        theme: localStorage.getItem('ea_theme') || 'default'
      }
    };

    this.observers = [];
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  /**
   * Notify observers of state change
   */
  notifyObservers() {
    this.observers.forEach(callback => callback(this.state));
  }

  /**
   * Set user data
   */
  setUser(user) {
    this.state.user = user;
    localStorage.setItem('ea_user', JSON.stringify(user));
    this.notifyObservers();
  }

  /**
   * Get user data
   */
  getUser() {
    return this.state.user || JSON.parse(localStorage.getItem('ea_user') || 'null');
  }

  /**
   * Update user preferences
   */
  setPreferences(preferences) {
    this.state.preferences = { ...this.state.preferences, ...preferences };
    localStorage.setItem('ea_preferences', JSON.stringify(this.state.preferences));
    this.notifyObservers();
  }

  /**
   * Get preferences
   */
  getPreferences() {
    return this.state.preferences;
  }

  /**
   * Set theme
   */
  setTheme(theme) {
    this.setPreferences({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode() {
    const darkMode = !this.state.preferences.darkMode;
    this.setPreferences({ darkMode });
    document.body.classList.toggle('dark-mode', darkMode);
    document.body.classList.toggle('light-mode', !darkMode);
  }

  /**
   * Set language
   */
  setLanguage(language) {
    this.setPreferences({ language });
  }

  /**
   * Load user data from API
   */
  async loadUserData() {
    try {
      // This would load from API
      const user = this.getUser();
      if (user) {
        this.setUser(user);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }

  /**
   * Clear all state
   */
  clear() {
    this.state = {
      user: null,
      elections: [],
      candidates: [],
      pollingBooths: [],
      reminders: [],
      preferences: this.state.preferences
    };
    this.notifyObservers();
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }
}
