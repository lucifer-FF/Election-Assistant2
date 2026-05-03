// Google Translate API Integration for Multilingual Support
// This module provides translation services and language detection

class GoogleTranslateIntegration {
    constructor() {
        this.apiKey = 'your-google-translate-api-key-here'; // Replace with your actual API key
        this.baseUrl = 'https://translation.googleapis.com/language/translate/v2';
        this.supportedLanguages = {
            'en': 'English',
            'hi': 'हिन्दी',
            'bn': 'বাংলা',
            'ta': 'தமிழ்',
            'te': 'తెలుగు',
            'mr': 'मराठी',
            'gu': 'ગુજરાતી',
            'kn': 'ಕನ್ನಡ',
            'ml': 'മലയാളം',
            'pa': 'ਪੰਜਾਬੀ',
            'ur': 'اردو',
            'or': 'ଓଡ଼ିଆ',
            'as': 'অসমীয়া'
        };
        this.currentLanguage = 'en';
        this.translationCache = new Map();
        this.isInitialized = false;
    }

    // Initialize the translation service
    async init() {
        try {
            // Test the API connection
            await this.getSupportedLanguages();
            this.isInitialized = true;
            console.log('Google Translate API initialized successfully');
            return { success: true };
        } catch (error) {
            console.error('Failed to initialize Google Translate API:', error);
            return { success: false, error: error.message };
        }
    }

    // Translate text
    async translateText(text, targetLanguage, sourceLanguage = null) {
        try {
            // Check cache first
            const cacheKey = `${text}_${sourceLanguage || 'auto'}_${targetLanguage}`;
            if (this.translationCache.has(cacheKey)) {
                return {
                    success: true,
                    translatedText: this.translationCache.get(cacheKey),
                    cached: true
                };
            }

            const url = `${this.baseUrl}?key=${this.apiKey}`;
            const requestBody = {
                q: text,
                target: targetLanguage,
                format: 'text'
            };

            if (sourceLanguage && sourceLanguage !== 'auto') {
                requestBody.source = sourceLanguage;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.data && data.data.translations && data.data.translations.length > 0) {
                const translatedText = data.data.translations[0].translatedText;
                const detectedSourceLanguage = data.data.translations[0].detectedSourceLanguage;
                
                // Cache the translation
                this.translationCache.set(cacheKey, translatedText);
                
                // Limit cache size
                if (this.translationCache.size > 1000) {
                    const firstKey = this.translationCache.keys().next().value;
                    this.translationCache.delete(firstKey);
                }
                
                return {
                    success: true,
                    translatedText: translatedText,
                    detectedSourceLanguage: detectedSourceLanguage,
                    cached: false
                };
            } else {
                throw new Error('No translation returned');
            }
        } catch (error) {
            console.error('Translation error:', error);
            return {
                success: false,
                error: error.message,
                originalText: text
            };
        }
    }

    // Translate multiple texts
    async translateMultiple(texts, targetLanguage, sourceLanguage = null) {
        try {
            const url = `${this.baseUrl}?key=${this.apiKey}`;
            const requestBody = {
                q: texts,
                target: targetLanguage,
                format: 'text'
            };

            if (sourceLanguage && sourceLanguage !== 'auto') {
                requestBody.source = sourceLanguage;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.data && data.data.translations) {
                return {
                    success: true,
                    translations: data.data.translations.map(translation => ({
                        translatedText: translation.translatedText,
                        detectedSourceLanguage: translation.detectedSourceLanguage
                    }))
                };
            } else {
                throw new Error('No translations returned');
            }
        } catch (error) {
            console.error('Multiple translation error:', error);
            return {
                success: false,
                error: error.message,
                originalTexts: texts
            };
        }
    }

    // Detect language of text
    async detectLanguage(text) {
        try {
            const url = `${this.baseUrl}/detect?key=${this.apiKey}`;
            const requestBody = {
                q: text
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.data && data.data.detections && data.data.detections.length > 0) {
                const detection = data.data.detections[0][0];
                return {
                    success: true,
                    language: detection.language,
                    confidence: detection.confidence,
                    isReliable: detection.isReliable
                };
            } else {
                throw new Error('Language detection failed');
            }
        } catch (error) {
            console.error('Language detection error:', error);
            return {
                success: false,
                error: error.message,
                originalText: text
            };
        }
    }

    // Get supported languages
    async getSupportedLanguages() {
        try {
            const url = `${this.baseUrl}/languages?key=${this.apiKey}&target=en`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.data && data.data.languages) {
                const languages = {};
                data.data.languages.forEach(lang => {
                    languages[lang.language] = lang.name;
                });
                
                // Merge with our predefined supported languages
                Object.assign(this.supportedLanguages, languages);
                
                return {
                    success: true,
                    languages: this.supportedLanguages
                };
            } else {
                throw new Error('Failed to get supported languages');
            }
        } catch (error) {
            console.error('Get supported languages error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Translate entire page content
    async translatePage(targetLanguage) {
        try {
            const elementsToTranslate = document.querySelectorAll('[data-translate], [data-i18n]');
            const translationPromises = [];

            elementsToTranslate.forEach(element => {
                const originalText = element.textContent.trim();
                if (originalText && originalText !== '') {
                    const translationPromise = this.translateText(originalText, targetLanguage);
                    translationPromise.then(result => {
                        if (result.success) {
                            element.textContent = result.translatedText;
                            element.setAttribute('data-translated', 'true');
                            element.setAttribute('data-original-text', originalText);
                        }
                    });
                    translationPromises.push(translationPromise);
                }
            });

            await Promise.all(translationPromises);
            
            this.currentLanguage = targetLanguage;
            
            // Update language selector
            const langSelector = document.getElementById('lang-selector');
            if (langSelector) {
                langSelector.value = targetLanguage;
            }

            return {
                success: true,
                elementsTranslated: elementsToTranslate.length
            };
        } catch (error) {
            console.error('Page translation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Restore original language
    restoreOriginalLanguage() {
        const translatedElements = document.querySelectorAll('[data-translated="true"]');
        
        translatedElements.forEach(element => {
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.textContent = originalText;
                element.removeAttribute('data-translated');
                element.removeAttribute('data-original-text');
            }
        });

        this.currentLanguage = 'en';
        
        // Update language selector
        const langSelector = document.getElementById('lang-selector');
        if (langSelector) {
            langSelector.value = 'en';
        }
    }

    // Translate form labels and placeholders
    async translateForm(formElement, targetLanguage) {
        try {
            const formElements = formElement.querySelectorAll('label, input, textarea, select, button');
            const translationPromises = [];

            formElements.forEach(element => {
                // Translate labels
                const label = element.querySelector('label') || element;
                if (label && label.textContent.trim()) {
                    const translationPromise = this.translateText(label.textContent.trim(), targetLanguage);
                    translationPromise.then(result => {
                        if (result.success) {
                            label.setAttribute('data-original-text', label.textContent);
                            label.textContent = result.translatedText;
                        }
                    });
                    translationPromises.push(translationPromise);
                }

                // Translate placeholders
                if (element.placeholder && element.placeholder.trim()) {
                    const translationPromise = this.translateText(element.placeholder.trim(), targetLanguage);
                    translationPromise.then(result => {
                        if (result.success) {
                            element.setAttribute('data-original-placeholder', element.placeholder);
                            element.placeholder = result.translatedText;
                        }
                    });
                    translationPromises.push(translationPromise);
                }

                // Translate button text
                if (element.tagName === 'BUTTON' && element.textContent.trim()) {
                    const translationPromise = this.translateText(element.textContent.trim(), targetLanguage);
                    translationPromise.then(result => {
                        if (result.success) {
                            element.setAttribute('data-original-text', element.textContent);
                            element.textContent = result.translatedText;
                        }
                    });
                    translationPromises.push(translationPromise);
                }
            });

            await Promise.all(translationPromises);

            return {
                success: true,
                elementsTranslated: formElements.length
            };
        } catch (error) {
            console.error('Form translation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get language name from code
    getLanguageName(languageCode) {
        return this.supportedLanguages[languageCode] || languageCode;
    }

    // Set current language
    setCurrentLanguage(languageCode) {
        if (this.supportedLanguages[languageCode]) {
            this.currentLanguage = languageCode;
            localStorage.setItem('preferred_language', languageCode);
        }
    }

    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // Auto-detect and translate to user's preferred language
    async autoTranslate() {
        try {
            // Get user's preferred language from browser or localStorage
            const preferredLanguage = localStorage.getItem('preferred_language') || 
                                   navigator.language.split('-')[0] || 
                                   'en';

            // Detect page language
            const pageText = document.body.textContent.substring(0, 200);
            const detection = await this.detectLanguage(pageText);

            if (detection.success && detection.language !== preferredLanguage) {
                // Ask user if they want to translate
                const shouldTranslate = confirm(
                    `Page is in ${this.getLanguageName(detection.language)}. ` +
                    `Translate to ${this.getLanguageName(preferredLanguage)}?`
                );

                if (shouldTranslate) {
                    await this.translatePage(preferredLanguage);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Auto-translation error:', error);
            return { success: false, error: error.message };
        }
    }

    // Create language selector
    createLanguageSelector(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const selector = document.createElement('select');
        selector.id = 'google-translate-selector';
        selector.className = 'language-selector';
        
        // Add options for supported languages
        Object.entries(this.supportedLanguages).forEach(([code, name]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = name;
            if (code === this.currentLanguage) {
                option.selected = true;
            }
            selector.appendChild(option);
        });

        // Add change event listener
        selector.addEventListener('change', async (event) => {
            const targetLanguage = event.target.value;
            
            if (targetLanguage === 'en') {
                this.restoreOriginalLanguage();
            } else {
                await this.translatePage(targetLanguage);
            }
        });

        container.appendChild(selector);
        return selector;
    }

    // Clear translation cache
    clearCache() {
        this.translationCache.clear();
    }

    // Get cache statistics
    getCacheStats() {
        return {
            size: this.translationCache.size,
            maxSize: 1000
        };
    }

    // Check if service is initialized
    isReady() {
        return this.isInitialized;
    }

    // Get service status
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentLanguage: this.currentLanguage,
            supportedLanguages: Object.keys(this.supportedLanguages).length,
            cacheSize: this.translationCache.size
        };
    }
}

// Create global instance
const googleTranslate = new GoogleTranslateIntegration();

// Export for use in other modules
export default googleTranslate;
