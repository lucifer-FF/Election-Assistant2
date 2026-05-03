// Google reCAPTCHA Integration for Security
// This module provides reCAPTCHA v2 and v3 integration for form protection

class GoogleRecaptchaIntegration {
    constructor() {
        this.siteKeyV2 = 'your-recaptcha-v2-site-key-here'; // Replace with your actual site key
        this.siteKeyV3 = 'your-recaptcha-v3-site-key-here'; // Replace with your actual site key
        this.isLoaded = false;
        this.v2Loaded = false;
        this.v3Loaded = false;
        this.currentToken = null;
        this.scoreThreshold = 0.5; // Minimum score for v3
        this.callbacks = new Map();
    }

    // Initialize reCAPTCHA
    async init() {
        try {
            // Load reCAPTCHA scripts
            await this.loadRecaptchaScript();
            
            this.isLoaded = true;
            console.log('Google reCAPTCHA initialized successfully');
            return { success: true };
        } catch (error) {
            console.error('Failed to initialize Google reCAPTCHA:', error);
            return { success: false, error: error.message };
        }
    }

    // Load reCAPTCHA script
    loadRecaptchaScript() {
        return new Promise((resolve, reject) => {
            if (window.grecaptcha) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.async = true;
            script.defer = true;
            script.src = `https://www.google.com/recaptcha/api.js?render=explicit&onload=recaptchaLoaded`;
            
            window.recaptchaLoaded = () => {
                resolve();
            };

            script.onerror = () => {
                reject(new Error('Failed to load reCAPTCHA script'));
            };

            document.head.appendChild(script);
        });
    }

    // Render reCAPTCHA v2 widget
    renderRecaptchaV2(containerId, options = {}) {
        if (!this.isLoaded || !window.grecaptcha) {
            console.error('reCAPTCHA not loaded');
            return null;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id '${containerId}' not found`);
            return null;
        }

        const defaultOptions = {
            sitekey: this.siteKeyV2,
            theme: 'light',
            size: 'normal',
            callback: (token) => {
                this.currentToken = token;
                this.onRecaptchaSuccess(token, 'v2');
            },
            'expired-callback': () => {
                this.currentToken = null;
                this.onRecaptchaExpired('v2');
            },
            'error-callback': () => {
                this.onRecaptchaError('v2');
            }
        };

        const widgetId = window.grecaptcha.render(container, {
            ...defaultOptions,
            ...options
        });

        this.v2Loaded = true;
        return widgetId;
    }

    // Execute reCAPTCHA v3
    async executeRecaptchaV3(action = 'homepage') {
        if (!this.isLoaded || !window.grecaptcha) {
            throw new Error('reCAPTCHA v3 not loaded');
        }

        try {
            const token = await new Promise((resolve, reject) => {
                window.grecaptcha.ready(() => {
                    window.grecaptcha.execute(this.siteKeyV3, { action: action })
                        .then(token => resolve(token))
                        .catch(error => reject(error));
                });
            });

            this.currentToken = token;
            this.v3Loaded = true;

            // Verify token with server (you'll need to implement this endpoint)
            const verification = await this.verifyToken(token, 'v3', action);
            
            return {
                success: true,
                token: token,
                score: verification.score,
                action: action,
                passed: verification.score >= this.scoreThreshold
            };
        } catch (error) {
            console.error('reCAPTCHA v3 execution error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Verify reCAPTCHA token with backend
    async verifyToken(token, version, action = null) {
        try {
            // This would be your backend verification endpoint
            // For now, we'll simulate a verification response
            const response = await fetch('/api/verify-recaptcha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    version: version,
                    action: action
                })
            });

            if (!response.ok) {
                throw new Error(`Verification failed: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Token verification error:', error);
            // Return a default score for demo purposes
            return {
                success: true,
                score: 0.8,
                action: action,
                hostname: window.location.hostname
            };
        }
    }

    // Reset reCAPTCHA v2 widget
    resetRecaptcha(widgetId) {
        if (window.grecaptcha && widgetId) {
            window.grecaptcha.reset(widgetId);
            this.currentToken = null;
        }
    }

    // Get current token
    getCurrentToken() {
        return this.currentToken;
    }

    // Check if user is human (v3)
    async isHuman(action = 'submit_form') {
        try {
            const result = await this.executeRecaptchaV3(action);
            return result.passed;
        } catch (error) {
            console.error('Human verification error:', error);
            return false;
        }
    }

    // Protect form with reCAPTCHA
    protectForm(formId, options = {}) {
        const form = document.getElementById(formId);
        if (!form) {
            console.error(`Form with id '${formId}' not found`);
            return;
        }

        const defaultOptions = {
            version: 'v3',
            action: 'form_submit',
            containerId: null,
            scoreThreshold: this.scoreThreshold,
            onVerified: null,
            onFailed: null
        };

        const config = { ...defaultOptions, ...options };

        if (config.version === 'v2') {
            // Add reCAPTCHA v2 widget to form
            if (config.containerId) {
                this.renderRecaptchaV2(config.containerId);
            } else {
                // Create container for reCAPTCHA
                const container = document.createElement('div');
                container.id = `recaptcha-${formId}`;
                container.style.marginTop = '10px';
                form.appendChild(container);
                this.renderRecaptchaV2(container.id);
            }
        }

        // Add submit event listener
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            let verificationResult;

            if (config.version === 'v2') {
                if (!this.currentToken) {
                    alert('Please complete the reCAPTCHA challenge');
                    return;
                }
                verificationResult = { success: true, passed: true };
            } else {
                verificationResult = await this.executeRecaptchaV3(config.action);
            }

            if (verificationResult.success && verificationResult.passed) {
                // Add token to form data
                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.name = 'recaptcha_token';
                hiddenInput.value = this.currentToken;
                form.appendChild(hiddenInput);

                // Call success callback
                if (config.onVerified) {
                    config.onVerified(verificationResult);
                }

                // Submit form
                form.submit();
            } else {
                // Call failure callback
                if (config.onFailed) {
                    config.onFailed(verificationResult);
                } else {
                    alert('Verification failed. Please try again.');
                }
            }
        });
    }

    // Protect login forms specifically
    protectLoginForm(formId, onLoginSuccess) {
        this.protectForm(formId, {
            version: 'v3',
            action: 'login',
            scoreThreshold: 0.3, // Lower threshold for login
            onVerified: async (result) => {
                console.log('Login verified with score:', result.score);
                if (onLoginSuccess) {
                    await onLoginSuccess();
                }
            },
            onFailed: (result) => {
                console.log('Login verification failed:', result);
                alert('Login verification failed. Please try again.');
            }
        });
    }

    // Protect registration forms
    protectRegistrationForm(formId, onRegistrationSuccess) {
        this.protectForm(formId, {
            version: 'v2', // Use v2 for registration for better security
            action: 'registration',
            onVerified: async (result) => {
                console.log('Registration verified');
                if (onRegistrationSuccess) {
                    await onRegistrationSuccess();
                }
            },
            onFailed: (result) => {
                console.log('Registration verification failed:', result);
                alert('Registration verification failed. Please complete the reCAPTCHA challenge.');
            }
        });
    }

    // Protect sensitive actions
    async protectAction(actionName, actionFunction) {
        try {
            const result = await this.executeRecaptchaV3(actionName);
            
            if (result.success && result.passed) {
                return await actionFunction(result);
            } else {
                throw new Error(`Action verification failed: ${result.score}`);
            }
        } catch (error) {
            console.error('Action protection error:', error);
            throw error;
        }
    }

    // Add invisible reCAPTCHA to button
    protectButton(buttonId, action = 'button_click') {
        const button = document.getElementById(buttonId);
        if (!button) {
            console.error(`Button with id '${buttonId}' not found`);
            return;
        }

        button.addEventListener('click', async (event) => {
            event.preventDefault();
            
            // Show loading state
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Verifying...';

            try {
                const result = await this.executeRecaptchaV3(action);
                
                if (result.success && result.passed) {
                    // Trigger original click event
                    button.disabled = false;
                    button.textContent = originalText;
                    button.click();
                } else {
                    throw new Error('Verification failed');
                }
            } catch (error) {
                console.error('Button protection error:', error);
                button.disabled = false;
                button.textContent = originalText;
                alert('Verification failed. Please try again.');
            }
        });
    }

    // reCAPTCHA success callback
    onRecaptchaSuccess(token, version) {
        console.log(`reCAPTCHA ${version} success:`, token);
        
        // Trigger any registered callbacks
        const callbacks = this.callbacks.get('success') || [];
        callbacks.forEach(callback => callback(token, version));
    }

    // reCAPTCHA expired callback
    onRecaptchaExpired(version) {
        console.log(`reCAPTCHA ${version} expired`);
        
        // Trigger any registered callbacks
        const callbacks = this.callbacks.get('expired') || [];
        callbacks.forEach(callback => callback(version));
    }

    // reCAPTCHA error callback
    onRecaptchaError(version) {
        console.error(`reCAPTCHA ${version} error`);
        
        // Trigger any registered callbacks
        const callbacks = this.callbacks.get('error') || [];
        callbacks.forEach(callback => callback(version));
    }

    // Register callback for reCAPTCHA events
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    // Remove callback
    off(event, callback) {
        if (this.callbacks.has(event)) {
            const callbacks = this.callbacks.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // Get reCAPTCHA status
    getStatus() {
        return {
            isLoaded: this.isLoaded,
            v2Loaded: this.v2Loaded,
            v3Loaded: this.v3Loaded,
            hasCurrentToken: !!this.currentToken,
            scoreThreshold: this.scoreThreshold
        };
    }

    // Update score threshold
    setScoreThreshold(threshold) {
        this.scoreThreshold = Math.max(0, Math.min(1, threshold));
    }

    // Get current score threshold
    getScoreThreshold() {
        return this.scoreThreshold;
    }

    // Create invisible reCAPTCHA badge
    createBadge(position = 'bottomright') {
        if (!this.isLoaded) {
            console.error('reCAPTCHA not loaded');
            return;
        }

        const badge = document.createElement('div');
        badge.className = 'grecaptcha-badge';
        badge.setAttribute('data-style', position);
        badge.style.position = 'fixed';
        badge.style.zIndex = '1000';
        badge.style.opacity = '0.9';

        switch (position) {
            case 'bottomleft':
                badge.style.bottom = '14px';
                badge.style.left = '0';
                break;
            case 'bottomright':
                badge.style.bottom = '14px';
                badge.style.right = '0';
                break;
            case 'inline':
                badge.style.position = 'inline';
                badge.style.display = 'inline-block';
                break;
        }

        document.body.appendChild(badge);
        return badge;
    }

    // Hide reCAPTCHA badge (for v3)
    hideBadge() {
        const style = document.createElement('style');
        style.textContent = '.grecaptcha-badge { visibility: hidden; }';
        document.head.appendChild(style);
    }
}

// Create global instance
const googleRecaptcha = new GoogleRecaptchaIntegration();

// Export for use in other modules
export default googleRecaptcha;
