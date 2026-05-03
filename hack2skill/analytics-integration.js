// Firebase Analytics Integration
// This module handles analytics tracking for the Election Assistant platform

import { analytics } from './firebase-config.js';

class AnalyticsManager {
    constructor() {
        this.analytics = analytics;
        this.userId = null;
        this.sessionId = this.generateSessionId();
        this.sessionStartTime = new Date();
        this.pageViews = [];
        this.events = [];
        this.userProperties = {};
    }

    // Generate unique session ID
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Set user ID for analytics
    setUserId(userId) {
        this.userId = userId;
        // This would be implemented in a real Firebase Analytics setup
        console.log('Analytics: User ID set to', userId);
    }

    // Track page view
    trackPageView(pageName, pageTitle, additionalData = {}) {
        const pageViewData = {
            pageName: pageName,
            pageTitle: pageTitle,
            timestamp: new Date(),
            sessionId: this.sessionId,
            userId: this.userId,
            ...additionalData
        };

        this.pageViews.push(pageViewData);

        // Log to console (in production, this would send to Firebase Analytics)
        console.log('Analytics: Page View', pageViewData);

        // Send to Firebase Analytics
        this.sendAnalyticsEvent('page_view', {
            page_name: pageName,
            page_title: pageTitle,
            session_id: this.sessionId
        });

        return pageViewData;
    }

    // Track custom events
    trackEvent(eventName, eventParameters = {}) {
        const eventData = {
            eventName: eventName,
            parameters: eventParameters,
            timestamp: new Date(),
            sessionId: this.sessionId,
            userId: this.userId
        };

        this.events.push(eventData);

        // Log to console
        console.log('Analytics: Event', eventData);

        // Send to Firebase Analytics
        this.sendAnalyticsEvent(eventName, eventParameters);

        return eventData;
    }

    // Track user interactions
    trackInteraction(interactionType, targetElement, additionalData = {}) {
        return this.trackEvent('user_interaction', {
            interaction_type: interactionType,
            target_element: targetElement,
            ...additionalData
        });
    }

    // Track authentication events
    trackAuthEvent(authAction, method = 'email', success = true, errorMessage = null) {
        return this.trackEvent('authentication', {
            auth_action: authAction, // login, signup, logout
            method: method, // email, google, facebook
            success: success,
            error_message: errorMessage
        });
    }

    // Track chatbot interactions
    trackChatbotInteraction(messageType, messageLength, responseTime = null) {
        return this.trackEvent('chatbot_interaction', {
            message_type: messageType, // user_message, bot_response
            message_length: messageLength,
            response_time_ms: responseTime,
            session_id: this.sessionId
        });
    }

    // Track polling station searches
    trackPollingStationSearch(searchQuery, resultsCount = 0, searchMethod = 'manual') {
        return this.trackEvent('polling_station_search', {
            search_query: searchQuery,
            results_count: resultsCount,
            search_method: searchMethod // manual, geolocation, auto
        });
    }

    // Track candidate views
    trackCandidateView(candidateId, candidateName, constituency, party) {
        return this.trackEvent('candidate_view', {
            candidate_id: candidateId,
            candidate_name: candidateName,
            constituency: constituency,
            party: party
        });
    }

    // Track election reminder setup
    trackElectionReminderSetup(reminderTypes, emailProvided = false, phoneProvided = false) {
        return this.trackEvent('election_reminder_setup', {
            reminder_types: reminderTypes, // array of reminder types
            email_provided: emailProvided,
            phone_provided: phoneProvided
        });
    }

    // Track eligibility checker usage
    trackEligibilityCheck(checkResults, timeSpentSeconds = 0) {
        return this.trackEvent('eligibility_check', {
            check_results: checkResults, // eligible, not_eligible, partial
            time_spent_seconds: timeSpentSeconds
        });
    }

    // Track voter guidance usage
    trackVoterGuidance(priority, constituency, guidanceProvided = true) {
        return this.trackEvent('voter_guidance', {
            priority: priority,
            constituency: constituency,
            guidance_provided: guidanceProvided
        });
    }

    // Track news article views
    trackNewsView(articleId, category, source, readingTime = null) {
        return this.trackEvent('news_view', {
            article_id: articleId,
            category: category,
            source: source,
            reading_time_seconds: readingTime
        });
    }

    // Track form submissions
    trackFormSubmission(formName, success = true, errorMessage = null) {
        return this.trackEvent('form_submission', {
            form_name: formName,
            success: success,
            error_message: errorMessage
        });
    }

    // Track error events
    trackError(errorType, errorMessage, errorContext = {}) {
        return this.trackEvent('error', {
            error_type: errorType,
            error_message: errorMessage,
            error_context: errorContext,
            user_agent: navigator.userAgent,
            page_url: window.location.href
        });
    }

    // Track performance metrics
    trackPerformance(metricName, value, metricUnit = 'ms') {
        return this.trackEvent('performance', {
            metric_name: metricName,
            metric_value: value,
            metric_unit: metricUnit
        });
    }

    // Set user properties
    setUserProperty(propertyName, propertyValue) {
        this.userProperties[propertyName] = propertyValue;
        
        // In production, this would set user properties in Firebase Analytics
        console.log('Analytics: User Property Set', {
            propertyName: propertyName,
            propertyValue: propertyValue
        });
    }

    // Track user demographics
    trackUserDemographics(age, state, constituency, language = 'en') {
        this.setUserProperty('age_group', this.getAgeGroup(age));
        this.setUserProperty('state', state);
        this.setUserProperty('constituency', constituency);
        this.setUserProperty('language', language);
    }

    // Get age group from age
    getAgeGroup(age) {
        if (age < 18) return 'under_18';
        if (age < 25) return '18_24';
        if (age < 35) return '25_34';
        if (age < 45) return '35_44';
        if (age < 55) return '45_54';
        if (age < 65) return '55_64';
        return '65_plus';
    }

    // Track session duration
    trackSessionEnd() {
        const sessionDuration = new Date() - this.sessionStartTime;
        
        return this.trackEvent('session_end', {
            session_duration_ms: sessionDuration,
            session_duration_minutes: Math.round(sessionDuration / 60000),
            page_views_count: this.pageViews.length,
            events_count: this.events.length
        });
    }

    // Send analytics event to Firebase Analytics
    sendAnalyticsEvent(eventName, parameters) {
        // In a real implementation, this would use the Firebase Analytics SDK
        // For now, we'll simulate the event sending
        
        try {
            // This would be the actual Firebase Analytics call:
            // this.analytics.logEvent(eventName, parameters);
            
            // For demonstration, we'll store events locally
            const analyticsEvent = {
                eventName: eventName,
                parameters: parameters,
                timestamp: new Date().toISOString(),
                userId: this.userId,
                sessionId: this.sessionId
            };

            // Store in localStorage for demo purposes
            const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
            storedEvents.push(analyticsEvent);
            
            // Keep only last 100 events to avoid storage issues
            if (storedEvents.length > 100) {
                storedEvents.splice(0, storedEvents.length - 100);
            }
            
            localStorage.setItem('analytics_events', JSON.stringify(storedEvents));
            
            console.log('Analytics event sent:', analyticsEvent);
            
        } catch (error) {
            console.error('Failed to send analytics event:', error);
            this.trackError('analytics_error', error.message, { eventName: eventName });
        }
    }

    // Get analytics summary
    getAnalyticsSummary() {
        return {
            sessionId: this.sessionId,
            sessionDuration: new Date() - this.sessionStartTime,
            pageViews: this.pageViews.length,
            events: this.events.length,
            userId: this.userId,
            userProperties: this.userProperties
        };
    }

    // Export analytics data (for debugging)
    exportAnalyticsData() {
        return {
            session: {
                sessionId: this.sessionId,
                startTime: this.sessionStartTime,
                duration: new Date() - this.sessionStartTime
            },
            pageViews: this.pageViews,
            events: this.events,
            userProperties: this.userProperties,
            userId: this.userId
        };
    }

    // Clear analytics data
    clearAnalyticsData() {
        this.pageViews = [];
        this.events = [];
        this.userProperties = {};
        localStorage.removeItem('analytics_events');
    }

    // Initialize analytics tracking
    init() {
        // Track initial page load
        this.trackPageView('home', 'Election Assistant - Home');
        
        // Track user agent and device info
        this.setUserProperty('browser', this.getBrowserInfo());
        this.setUserProperty('device_type', this.getDeviceType());
        this.setUserProperty('operating_system', this.getOperatingSystem());
        
        // Track session start
        this.trackEvent('session_start', {
            session_id: this.sessionId,
            timestamp: this.sessionStartTime
        });
        
        // Set up page unload tracking
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });
        
        // Set up error tracking
        window.addEventListener('error', (event) => {
            this.trackError('javascript_error', event.message, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        console.log('Analytics initialized');
    }

    // Get browser information
    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
        if (userAgent.indexOf('Safari') > -1) return 'Safari';
        if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
        if (userAgent.indexOf('Edge') > -1) return 'Edge';
        return 'Other';
    }

    // Get device type
    getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'Mobile';
        if (width < 1024) return 'Tablet';
        return 'Desktop';
    }

    // Get operating system
    getOperatingSystem() {
        const userAgent = navigator.userAgent;
        if (userAgent.indexOf('Windows') > -1) return 'Windows';
        if (userAgent.indexOf('Mac') > -1) return 'macOS';
        if (userAgent.indexOf('Linux') > -1) return 'Linux';
        if (userAgent.indexOf('Android') > -1) return 'Android';
        if (userAgent.indexOf('iOS') > -1) return 'iOS';
        return 'Other';
    }
}

// Create global analytics instance
const analyticsManager = new AnalyticsManager();

// Initialize analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    analyticsManager.init();
});

// Export for use in other modules
export default analyticsManager;
