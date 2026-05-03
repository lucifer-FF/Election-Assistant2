// Google Calendar API Integration for Election Reminders
// This module provides calendar functionality for election-related events

class GoogleCalendarIntegration {
    constructor() {
        this.apiKey = 'your-google-calendar-api-key-here'; // Replace with your actual API key
        this.clientId = 'your-client-id-here'; // Replace with your actual client ID
        this.discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
        this.scopes = 'https://www.googleapis.com/auth/calendar';
        this.isLoaded = false;
        this.isSignedIn = false;
        this.calendarService = null;
        this.electionCalendarId = null;
    }

    // Initialize Google Calendar API
    async init() {
        try {
            await this.loadGapiScript();
            await this.loadGisScript();
            await this.initializeGapi();
            
            this.isLoaded = true;
            console.log('Google Calendar API initialized successfully');
            return { success: true };
        } catch (error) {
            console.error('Failed to initialize Google Calendar API:', error);
            return { success: false, error: error.message };
        }
    }

    // Load Google API script
    loadGapiScript() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load GAPI script'));
            document.head.appendChild(script);
        });
    }

    // Load Google Identity Services script
    loadGisScript() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.accounts) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load GIS script'));
            document.head.appendChild(script);
        });
    }

    // Initialize GAPI client
    async initializeGapi() {
        return new Promise((resolve, reject) => {
            window.gapi.load('client:auth2', async () => {
                try {
                    await window.gapi.client.init({
                        apiKey: this.apiKey,
                        clientId: this.clientId,
                        discoveryDocs: this.discoveryDocs,
                        scope: this.scopes
                    });
                    
                    this.calendarService = window.gapi.client.calendar;
                    
                    // Listen for sign-in state changes
                    window.gapi.auth2.getAuthInstance().isSignedIn.listen((isSignedIn) => {
                        this.isSignedIn = isSignedIn;
                        this.onAuthStateChange(isSignedIn);
                    });
                    
                    // Check initial sign-in state
                    this.isSignedIn = window.gapi.auth2.getAuthInstance().isSignedIn.get();
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    // Sign in to Google
    async signIn() {
        try {
            const googleAuth = window.gapi.auth2.getAuthInstance();
            await googleAuth.signIn();
            return { success: true };
        } catch (error) {
            console.error('Google sign-in error:', error);
            return { success: false, error: error.message };
        }
    }

    // Sign out from Google
    async signOut() {
        try {
            const googleAuth = window.gapi.auth2.getAuthInstance();
            await googleAuth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Google sign-out error:', error);
            return { success: false, error: error.message };
        }
    }

    // Create election reminder event
    async createElectionReminder(eventDetails) {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        const defaultDetails = {
            summary: 'Election Reminder',
            description: 'Important election-related reminder',
            location: '',
            startTime: new Date(),
            endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
            reminders: [
                { method: 'email', minutes: 24 * 60 }, // 1 day before
                { method: 'popup', minutes: 60 } // 1 hour before
            ]
        };

        const event = { ...defaultDetails, ...eventDetails };

        try {
            const response = await this.calendarService.events.insert({
                calendarId: 'primary',
                resource: {
                    summary: event.summary,
                    description: event.description,
                    location: event.location,
                    start: {
                        dateTime: event.startTime.toISOString(),
                        timeZone: 'Asia/Kolkata'
                    },
                    end: {
                        dateTime: event.endTime.toISOString(),
                        timeZone: 'Asia/Kolkata'
                    },
                    reminders: {
                        useDefault: false,
                        overrides: event.reminders
                    },
                    colorId: this.getEventColorId(event.type)
                }
            });

            return {
                success: true,
                eventId: response.result.id,
                eventLink: response.result.htmlLink
            };
        } catch (error) {
            console.error('Error creating calendar event:', error);
            return { success: false, error: error.message };
        }
    }

    // Create multiple election reminders
    async createElectionReminders(reminderTypes, electionDate) {
        const events = [];
        const baseDate = new Date(electionDate);

        reminderTypes.forEach(type => {
            let eventDate, summary, description;

            switch (type) {
                case 'registration':
                    eventDate = new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days before
                    summary = 'Voter Registration Deadline';
                    description = 'Last day to register for voting in the upcoming election. Complete your voter registration today!';
                    break;
                
                case 'campaign':
                    eventDate = new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days before
                    summary = 'Election Campaign Period';
                    description = 'Election campaign period has started. Stay informed about candidates and their manifestos.';
                    break;
                
                case 'voting':
                    eventDate = new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day before
                    summary = 'Election Day Tomorrow';
                    description = 'Election is tomorrow! Remember to carry your voter ID and reach your polling station on time.';
                    break;
                
                case 'results':
                    eventDate = new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days after
                    summary = 'Election Results Day';
                    description = 'Election results will be announced today. Stay tuned for official updates.';
                    break;
                
                default:
                    return;
            }

            events.push({
                type: type,
                summary: summary,
                description: description,
                startTime: eventDate,
                endTime: new Date(eventDate.getTime() + 60 * 60 * 1000), // 1 hour duration
                reminders: this.getRemindersForType(type)
            });
        });

        const results = [];
        for (const event of events) {
            const result = await this.createElectionReminder(event);
            results.push({ type: event.type, ...result });
        }

        return {
            success: true,
            events: results
        };
    }

    // Get reminders based on type
    getRemindersForType(type) {
        switch (type) {
            case 'registration':
                return [
                    { method: 'email', minutes: 7 * 24 * 60 }, // 1 week before
                    { method: 'popup', minutes: 24 * 60 } // 1 day before
                ];
            
            case 'campaign':
                return [
                    { method: 'email', minutes: 2 * 24 * 60 }, // 2 days before
                    { method: 'popup', minutes: 60 } // 1 hour before
                ];
            
            case 'voting':
                return [
                    { method: 'email', minutes: 24 * 60 }, // 1 day before
                    { method: 'popup', minutes: 12 * 60 }, // 12 hours before
                    { method: 'popup', minutes: 60 } // 1 hour before
                ];
            
            case 'results':
                return [
                    { method: 'email', minutes: 60 }, // 1 hour before
                    { method: 'popup', minutes: 15 } // 15 minutes before
                ];
            
            default:
                return [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 60 }
                ];
        }
    }

    // Get event color ID based on type
    getEventColorId(type) {
        const colorMap = {
            'registration': '6', // Orange
            'campaign': '2', // Green
            'voting': '11', // Red
            'results': '5' // Yellow
        };
        return colorMap[type] || '1'; // Default blue
    }

    // Get upcoming election events
    async getUpcomingEvents(daysAhead = 30) {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            const timeMin = new Date().toISOString();
            const timeMax = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

            const response = await this.calendarService.events.list({
                calendarId: 'primary',
                timeMin: timeMin,
                timeMax: timeMax,
                singleEvents: true,
                orderBy: 'startTime',
                q: 'election voting voter registration'
            });

            return {
                success: true,
                events: response.result.items.map(event => ({
                    id: event.id,
                    summary: event.summary,
                    description: event.description,
                    startTime: new Date(event.start.dateTime || event.start.date),
                    endTime: new Date(event.end.dateTime || event.end.date),
                    location: event.location,
                    colorId: event.colorId,
                    eventLink: event.htmlLink
                }))
            };
        } catch (error) {
            console.error('Error getting upcoming events:', error);
            return { success: false, error: error.message };
        }
    }

    // Update existing event
    async updateEvent(eventId, updates) {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            // First get the existing event
            const existingEvent = await this.calendarService.events.get({
                calendarId: 'primary',
                eventId: eventId
            });

            // Update the event with new data
            const updatedEvent = { ...existingEvent.result, ...updates };

            const response = await this.calendarService.events.update({
                calendarId: 'primary',
                eventId: eventId,
                resource: updatedEvent
            });

            return {
                success: true,
                event: response.result
            };
        } catch (error) {
            console.error('Error updating event:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete event
    async deleteEvent(eventId) {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            await this.calendarService.events.delete({
                calendarId: 'primary',
                eventId: eventId
            });

            return { success: true };
        } catch (error) {
            console.error('Error deleting event:', error);
            return { success: false, error: error.message };
        }
    }

    // Create election calendar
    async createElectionCalendar() {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            const response = await this.calendarService.calendars.insert({
                resource: {
                    summary: 'Election Reminders',
                    description: 'Important dates and reminders for upcoming elections',
                    timeZone: 'Asia/Kolkata'
                }
            });

            this.electionCalendarId = response.result.id;
            
            return {
                success: true,
                calendarId: response.result.id,
                calendarLink: response.result.htmlLink
            };
        } catch (error) {
            console.error('Error creating calendar:', error);
            return { success: false, error: error.message };
        }
    }

    // Add event to election calendar
    async addEventToElectionCalendar(eventDetails) {
        if (!this.electionCalendarId) {
            // Create election calendar if it doesn't exist
            const result = await this.createElectionCalendar();
            if (!result.success) {
                return result;
            }
        }

        try {
            const response = await this.calendarService.events.insert({
                calendarId: this.electionCalendarId,
                resource: eventDetails
            });

            return {
                success: true,
                eventId: response.result.id,
                eventLink: response.result.htmlLink
            };
        } catch (error) {
            console.error('Error adding event to election calendar:', error);
            return { success: false, error: error.message };
        }
    }

    // Share election calendar
    async shareCalendar(email, role = 'reader') {
        if (!this.electionCalendarId) {
            throw new Error('Election calendar not created');
        }

        try {
            const response = await this.calendarService.acl.insert({
                calendarId: this.electionCalendarId,
                resource: {
                    scope: {
                        type: 'user',
                        value: email
                    },
                    role: role
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Error sharing calendar:', error);
            return { success: false, error: error.message };
        }
    }

    // Get calendar list
    async getCalendarList() {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            const response = await this.calendarService.calendarList.list();
            
            return {
                success: true,
                calendars: response.result.items.map(calendar => ({
                    id: calendar.id,
                    summary: calendar.summary,
                    description: calendar.description,
                    primary: calendar.primary,
                    accessRole: calendar.accessRole
                }))
            };
        } catch (error) {
            console.error('Error getting calendar list:', error);
            return { success: false, error: error.message };
        }
    }

    // Auth state change handler
    onAuthStateChange(isSignedIn) {
        console.log('Google Calendar auth state changed:', isSignedIn);
        
        // Update UI based on auth state
        const signInButton = document.getElementById('calendar-sign-in');
        const signOutButton = document.getElementById('calendar-sign-out');
        
        if (signInButton) {
            signInButton.style.display = isSignedIn ? 'none' : 'block';
        }
        
        if (signOutButton) {
            signOutButton.style.display = isSignedIn ? 'block' : 'none';
        }
    }

    // Create calendar integration UI
    createCalendarUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="calendar-integration">
                <h3>Google Calendar Integration</h3>
                <div id="calendar-auth-section">
                    <button id="calendar-sign-in" class="btn btn-primary">
                        📅 Connect Google Calendar
                    </button>
                    <button id="calendar-sign-out" class="btn btn-secondary" style="display: none;">
                        🚪 Disconnect
                    </button>
                </div>
                <div id="calendar-actions" style="display: none;">
                    <h4>Set Election Reminders</h4>
                    <div class="reminder-options">
                        <label>
                            <input type="checkbox" id="reminder-registration" checked>
                            Voter Registration Deadline
                        </label>
                        <label>
                            <input type="checkbox" id="reminder-campaign" checked>
                            Campaign Period Start
                        </label>
                        <label>
                            <input type="checkbox" id="reminder-voting" checked>
                            Election Day
                        </label>
                        <label>
                            <input type="checkbox" id="reminder-results" checked>
                            Results Day
                        </label>
                    </div>
                    <button id="create-reminders" class="btn btn-primary">
                        ⏰ Create Reminders
                    </button>
                    <div id="calendar-status" class="status-message"></div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('calendar-sign-in').addEventListener('click', () => {
            this.signIn();
        });

        document.getElementById('calendar-sign-out').addEventListener('click', () => {
            this.signOut();
        });

        document.getElementById('create-reminders').addEventListener('click', () => {
            this.createRemindersFromUI();
        });

        // Update UI based on current auth state
        this.onAuthStateChange(this.isSignedIn);
    }

    // Create reminders from UI
    async createRemindersFromUI() {
        const reminderTypes = [];
        
        if (document.getElementById('reminder-registration').checked) {
            reminderTypes.push('registration');
        }
        if (document.getElementById('reminder-campaign').checked) {
            reminderTypes.push('campaign');
        }
        if (document.getElementById('reminder-voting').checked) {
            reminderTypes.push('voting');
        }
        if (document.getElementById('reminder-results').checked) {
            reminderTypes.push('results');
        }

        if (reminderTypes.length === 0) {
            alert('Please select at least one reminder type');
            return;
        }

        const statusDiv = document.getElementById('calendar-status');
        statusDiv.textContent = 'Creating reminders...';
        statusDiv.className = 'status-message info';

        try {
            // Use a sample election date (you would get this from your election data)
            const electionDate = new Date('2026-04-06');
            const result = await this.createElectionReminders(reminderTypes, electionDate);

            if (result.success) {
                const successCount = result.events.filter(e => e.success).length;
                statusDiv.textContent = `Successfully created ${successCount} of ${result.events.length} reminders!`;
                statusDiv.className = 'status-message success';
            } else {
                statusDiv.textContent = 'Failed to create reminders. Please try again.';
                statusDiv.className = 'status-message error';
            }
        } catch (error) {
            statusDiv.textContent = 'Error: ' + error.message;
            statusDiv.className = 'status-message error';
        }
    }

    // Get service status
    getStatus() {
        return {
            isLoaded: this.isLoaded,
            isSignedIn: this.isSignedIn,
            hasCalendarService: !!this.calendarService,
            electionCalendarId: this.electionCalendarId
        };
    }
}

// Create global instance
const googleCalendar = new GoogleCalendarIntegration();

// Export for use in other modules
export default googleCalendar;
