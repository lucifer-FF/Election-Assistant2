# Firebase Integration Setup Instructions

This guide will help you set up all the Firebase services and API integrations for the Election Assistant platform.

## Prerequisites

1. **Firebase Project**: Create a new Firebase project at https://console.firebase.google.com
2. **Google Cloud Project**: Enable required APIs in Google Cloud Console
3. **API Keys**: Generate API keys for Google Maps and Gemini API

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name (e.g., "election-assistant-2026")
4. Enable Google Analytics
5. Select existing Google Analytics account or create new one

### 1.2 Enable Firebase Services
In your Firebase project, enable:
- **Authentication** → Email/Password, Google, Facebook providers
- **Firestore Database** → Start in test mode
- **Storage** → Start in test mode
- **Hosting** → Enable for deployment

### 1.3 Get Firebase Configuration
1. Go to Project Settings → General → Your apps
2. Click Web app → Register app
3. Copy the Firebase configuration object
4. Update `firebase-config.js` with your actual configuration:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id"
};
```

## Step 2: Firestore Database Setup

### 2.1 Deploy Security Rules
1. Go to Firestore Database → Rules
2. Replace existing rules with content from `firestore-rules.firestore`
3. Click "Publish"

### 2.2 Create Indexes
1. Go to Firestore Database → Indexes
2. Use the `firestore.indexes.json` file to create required indexes
3. You can deploy indexes using Firebase CLI:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### 2.3 Initialize Sample Data (Optional)
1. Uncomment the database initialization code in `main.js`
2. Or run manually from browser console:
   ```javascript
   const dbSetup = new FirestoreDatabaseSetup();
   dbSetup.initializeDatabase();
   ```

## Step 3: Google Maps API Setup

### 3.1 Enable Google Maps APIs
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Distance Matrix API

### 3.2 Get API Key
1. Go to Credentials → Create Credentials → API Key
2. Restrict the key to:
   - HTTP referrers: Your domain
   - APIs: Maps JavaScript API, Places API, Geocoding API
3. Copy the API key
4. Update `google-maps-integration.js`:
   ```javascript
   this.apiKey = 'your-actual-google-maps-api-key';
   ```

## Step 4: Gemini API Setup

### 4.1 Enable Gemini API
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create a new API key for Gemini
3. Or use Google Cloud Console:
   - Enable Generative Language API
   - Create API key

### 4.2 Configure Gemini Integration
Update `gemini-api-integration.js`:
```javascript
this.apiKey = 'your-actual-gemini-api-key';
```

### 4.3 Test Gemini Integration
1. Open the application
2. Open chatbot modal
3. Send a test message
4. Check console for initialization status

## Step 5: Firebase Hosting Setup

### 5.1 Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 5.2 Login and Initialize
```bash
firebase login
firebase init hosting
```

### 5.3 Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

### 5.4 Configure Custom Domain (Optional)
1. Go to Firebase Hosting → Custom domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Step 6: Firebase Analytics Setup

### 6.1 Analytics is Already Configured
Firebase Analytics was enabled during project setup. The `analytics-integration.js` file handles:
- Page view tracking
- User interaction tracking
- Authentication events
- Custom events for election-specific actions

### 6.2 View Analytics Data
1. Go to Firebase Console → Analytics
2. View real-time data, events, and user properties
3. Create custom dashboards for election metrics

## Step 7: Environment Configuration

### 7.1 Create Environment File
Create `.env.local` in your project root:
```env
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id

GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GEMINI_API_KEY=your-gemini-api-key
```

### 7.2 Security Considerations
- Never commit API keys to version control
- Use environment variables in production
- Restrict API keys to specific domains and APIs
- Enable API key rotation policies

## Step 8: Testing the Integration

### 8.1 Test Authentication
1. Try to sign up with a new email
2. Verify email confirmation
3. Test login/logout functionality
4. Check Firebase Console → Authentication for user data

### 8.2 Test Database Operations
1. Create a new user account
2. Check Firestore Database for user document
3. Verify data structure matches schema

### 8.3 Test Google Maps
1. Go to Polling Booth Locator
2. Search for polling stations
3. Verify map displays correctly
4. Test directions functionality

### 8.4 Test Gemini Chatbot
1. Open chatbot modal
2. Ask election-related questions
3. Verify responses are helpful and neutral
4. Check console for API errors

### 8.5 Test Analytics
1. Navigate through different pages
2. Perform various actions
3. Check Firebase Console → Analytics → Real-time
4. Verify events are being tracked

## Step 9: Production Deployment

### 9.1 Build for Production
```bash
# If using build tools
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 9.2 Configure Production Settings
1. Update API key restrictions to production domain
2. Enable Firebase Security Rules in production mode
3. Set up monitoring and alerts
4. Configure backup and recovery

### 9.3 Monitor Performance
1. Use Firebase Performance Monitoring
2. Set up error reporting
3. Monitor API usage and costs
4. Set up billing alerts

## Troubleshooting

### Common Issues

**Firebase Authentication Errors**
- Check API key configuration
- Verify email/password providers are enabled
- Check CORS settings

**Google Maps Not Loading**
- Verify API key is valid and has correct restrictions
- Check if required APIs are enabled
- Verify billing account is set up

**Gemini API Errors**
- Check API key and model availability
- Verify content safety settings
- Monitor API quota usage

**Firestore Permission Errors**
- Review security rules
- Check user authentication state
- Verify collection names match rules

**Analytics Not Tracking**
- Verify measurement ID is correct
- Check ad-blocker settings
- Verify Firebase SDK is loading correctly

### Debug Tools

**Firebase Emulator Suite**
```bash
firebase emulators:start
```

**Browser Console**
- Check for JavaScript errors
- Monitor network requests
- Verify API responses

**Firebase Console**
- Authentication: Check user creation and login attempts
- Firestore: Monitor database operations
- Hosting: Check deployment status
- Analytics: Review event tracking

## Next Steps

1. **Customize the UI** to match your election theme
2. **Add more features** like real-time election results
3. **Implement push notifications** for election reminders
4. **Set up CI/CD pipeline** for automated deployments
5. **Add comprehensive testing** for all integrations
6. **Implement monitoring and alerting**

## Support

For additional help:
- Firebase Documentation: https://firebase.google.com/docs
- Google Maps API Documentation: https://developers.google.com/maps
- Gemini API Documentation: https://ai.google.dev/docs
- Firebase Support: https://firebase.google.com/support

---

**Last Updated**: May 3, 2026  
**Version**: 1.0.0  
**Status**: Ready for deployment
