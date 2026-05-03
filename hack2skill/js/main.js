import { store } from './store.js';
import { router } from './router.js';
import { setupLanguageSelector } from './translations.js';
import { setupNavigation } from './ui/navigation.js';
import { setupModals } from './ui/modals.js';
import { setupVoterData } from './features/voterData.js';
import { setupPollingBooth } from './features/pollingBooth.js';
import { setupReminders } from './features/reminders.js';
import { setupChatbot } from './features/chatbot.js';

// Import Firebase and new integrations
import firebaseAuthManager from '../firebase-config.js';
import googleMaps from '../google-maps-integration.js';
import geminiChatbot from '../gemini-api-integration.js';
import analyticsManager from '../analytics-integration.js';
import FirestoreDatabaseSetup from '../firestore-database-setup.js';

// Import Google Services integrations
import googlePlaces from '../google-places-integration.js';
import googleTranslate from '../google-translate-integration.js';
import googleRecaptcha from '../google-recaptcha-integration.js';
import googleCalendar from '../google-calendar-integration.js';
import googleDrive from '../google-drive-integration.js';
import googleSheets from '../google-sheets-integration.js';
import googleVision from '../google-vision-integration.js';
import googleCloudStorage from '../google-cloud-storage-integration.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Firebase services first
    await initializeFirebaseServices();
    
    // Initialize Router first
    router.init();
    updateNavUI();

    setupLanguageSelector();
    setupModals();
    setupVoterData();
    setupPollingBooth();
    setupReminders();
    setupChatbot();
});

// Initialize Firebase and Google services
async function initializeFirebaseServices() {
    try {
        console.log('Initializing Firebase and Google services...');
        
        // Initialize Firebase services
        await googleMaps.init();
        console.log('Google Maps initialized');
        
        await geminiChatbot.init();
        console.log('Gemini Chatbot initialized');
        
        // Initialize Google Services
        await googlePlaces.init();
        console.log('Google Places API initialized');
        
        await googleTranslate.init();
        console.log('Google Translate API initialized');
        
        await googleRecaptcha.init();
        console.log('Google reCAPTCHA initialized');
        
        await googleCalendar.init();
        console.log('Google Calendar API initialized');
        
        await googleDrive.init();
        console.log('Google Drive API initialized');
        
        await googleSheets.init();
        console.log('Google Sheets API initialized');
        
        await googleVision.init();
        console.log('Google Vision API initialized');
        
        await googleCloudStorage.init();
        console.log('Google Cloud Storage initialized');
        
        // Analytics is already initialized in analytics-integration.js
        console.log('Analytics initialized');
        
        // Initialize database setup (optional - only if needed)
        // const dbSetup = new FirestoreDatabaseSetup();
        // await dbSetup.initializeDatabase();
        
        console.log('All Firebase and Google services initialized successfully');
    } catch (error) {
        console.error('Error initializing services:', error);
        analyticsManager.trackError('services_init_error', error.message);
    }
}

function updateNavUI() {
    const user = store.state.currentUser;
    const loginBtn = document.getElementById('nav-login');
    const logoutBtn = document.getElementById('nav-logout');
    const dashboardBtn = document.getElementById('nav-dashboard');
    const adminBtn = document.getElementById('nav-admin');

    if (user) {
        if(loginBtn) loginBtn.style.display = 'none';
        if(logoutBtn) logoutBtn.style.display = 'block';
        if(dashboardBtn) dashboardBtn.style.display = 'block';
        if(adminBtn) adminBtn.style.display = user.role === 'admin' ? 'block' : 'none';
    } else {
        if(loginBtn) loginBtn.style.display = 'block';
        if(logoutBtn) logoutBtn.style.display = 'none';
        if(dashboardBtn) dashboardBtn.style.display = 'none';
        if(adminBtn) adminBtn.style.display = 'none';
    }
}

window.handleLogin = async function(role) {
    const emailEl = role === 'admin' ? document.getElementById('admin-username') : document.getElementById('login-username');
    const passEl = role === 'admin' ? document.getElementById('admin-password') : document.getElementById('login-password');
    const btn = event.target;
    
    if(!emailEl.value || !passEl.value) {
        alert('Please enter both email and password');
        return;
    }

    const originalText = btn.textContent;
    btn.textContent = 'Logging in...';
    btn.disabled = true;

    try {
        // Use Firebase authentication
        const result = await firebaseAuthManager.signIn(emailEl.value, passEl.value);
        
        if (!result.success) {
            throw new Error(result.error);
        }

        const user = result.user;
        
        // Get user profile from Firestore
        const userProfile = await firebaseAuthManager.getUserProfile(user.uid);
        
        if (role === 'admin' && userProfile?.role !== 'admin') {
            alert('Invalid Admin Credentials');
            await firebaseAuthManager.signOut();
            return;
        }

        // Update local store with Firebase user data
        store.state.currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: userProfile?.role || 'voter',
            fullName: userProfile?.fullName || user.displayName,
            state: userProfile?.state,
            constituency: userProfile?.constituency
        };

        // Track authentication event
        analyticsManager.trackAuthEvent('login', 'email', true);
        analyticsManager.setUserId(user.uid);
        
        // Track user demographics if available
        if (userProfile) {
            analyticsManager.trackUserDemographics(
                userProfile.age || 25,
                userProfile.state || 'Unknown',
                userProfile.constituency || 'Unknown',
                'en'
            );
        }

        document.getElementById('login-modal').style.display = 'none';
        updateNavUI();
        
        const redirectRoute = userProfile?.role === 'admin' ? '#/admin' : '#/dashboard';
        window.location.hash = redirectRoute;
        
        analyticsManager.trackPageView(
            userProfile?.role === 'admin' ? 'admin' : 'dashboard',
            userProfile?.role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'
        );
        
    } catch(error) {
        console.error('Login error:', error);
        analyticsManager.trackAuthEvent('login', 'email', false, error.message);
        alert("Login failed: " + error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
        emailEl.value = '';
        passEl.value = '';
    }
};

window.handleLogout = async function() {
    try {
        // Track logout event
        if (store.state.currentUser) {
            analyticsManager.trackAuthEvent('logout', 'email', true);
        }
        
        // Sign out from Firebase
        await firebaseAuthManager.signOut();
        
        // Clear local store
        store.logout();
        
        // Clear analytics user data
        analyticsManager.setUserId(null);
        
        updateNavUI();
        window.location.hash = '#/';
        
        // Track page view for home
        analyticsManager.trackPageView('home', 'Election Assistant - Home');
        
    } catch(error) {
        console.error('Logout error:', error);
        analyticsManager.trackAuthEvent('logout', 'email', false, error.message);
    }
};
