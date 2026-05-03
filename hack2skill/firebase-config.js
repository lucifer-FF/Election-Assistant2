// Firebase Configuration
// Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, FacebookAuthProvider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, updateDoc, deleteDoc, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const storage = getStorage(app);

// Export Firebase services for use in other modules
export { auth, db, analytics, storage };

// Authentication providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Export authentication functions
export {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    googleProvider,
    facebookProvider,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    deleteDoc,
    addDoc,
    ref,
    uploadBytes,
    getDownloadURL
};

// Firebase Authentication Helper Class
class FirebaseAuthManager {
    constructor() {
        this.auth = auth;
        this.db = db;
        this.currentUser = null;
        this.initAuthStateListener();
    }

    initAuthStateListener() {
        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            if (user) {
                this.updateUIForLoggedInUser(user);
            } else {
                this.updateUIForLoggedOutUser();
            }
        });
    }

    async signUp(email, password, userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            // Store additional user data in Firestore
            await setDoc(doc(this.db, "users", user.uid), {
                uid: user.uid,
                email: email,
                fullName: userData.fullName,
                phone: userData.phone,
                state: userData.state,
                constituency: userData.constituency,
                role: userData.role || 'voter',
                createdAt: new Date(),
                lastLogin: new Date(),
                emailVerified: false,
                phoneVerified: false
            });

            return { success: true, user: user };
        } catch (error) {
            console.error("Signup error:", error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            // Update last login
            await updateDoc(doc(this.db, "users", user.uid), {
                lastLogin: new Date()
            });

            return { success: true, user: user };
        } catch (error) {
            console.error("Signin error:", error);
            return { success: false, error: error.message };
        }
    }

    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(this.auth, googleProvider);
            const user = result.user;
            
            // Check if user exists in Firestore, if not create
            const userDoc = await getDoc(doc(this.db, "users", user.uid));
            if (!userDoc.exists()) {
                await setDoc(doc(this.db, "users", user.uid), {
                    uid: user.uid,
                    email: user.email,
                    fullName: user.displayName,
                    photoURL: user.photoURL,
                    role: 'voter',
                    createdAt: new Date(),
                    lastLogin: new Date(),
                    emailVerified: user.emailVerified,
                    provider: 'google'
                });
            } else {
                // Update last login
                await updateDoc(doc(this.db, "users", user.uid), {
                    lastLogin: new Date()
                });
            }

            return { success: true, user: user };
        } catch (error) {
            console.error("Google signin error:", error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            await signOut(this.auth);
            return { success: true };
        } catch (error) {
            console.error("Signout error:", error);
            return { success: false, error: error.message };
        }
    }

    updateUIForLoggedInUser(user) {
        // Update navigation
        document.getElementById('nav-login').style.display = 'none';
        document.getElementById('nav-logout').style.display = 'block';
        document.getElementById('nav-dashboard').style.display = 'block';
        
        // Check if admin
        this.checkAdminRole(user.uid);
        
        // Close login modal if open
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.style.display = 'none';
        }
        
        // Show welcome message
        this.showWelcomeMessage(user);
    }

    updateUIForLoggedOutUser() {
        // Update navigation
        document.getElementById('nav-login').style.display = 'block';
        document.getElementById('nav-logout').style.display = 'none';
        document.getElementById('nav-dashboard').style.display = 'none';
        document.getElementById('nav-admin').style.display = 'none';
    }

    async checkAdminRole(uid) {
        try {
            const userDoc = await getDoc(doc(this.db, "users", uid));
            if (userDoc.exists() && userDoc.data().role === 'admin') {
                document.getElementById('nav-admin').style.display = 'block';
            }
        } catch (error) {
            console.error("Error checking admin role:", error);
        }
    }

    showWelcomeMessage(user) {
        const message = `Welcome back, ${user.displayName || user.email}!`;
        // You can implement a toast notification here
        console.log(message);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    async getUserProfile(uid) {
        try {
            const userDoc = await getDoc(doc(this.db, "users", uid));
            if (userDoc.exists()) {
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error("Error getting user profile:", error);
            return null;
        }
    }
}

// Initialize Firebase Auth Manager
const firebaseAuthManager = new FirebaseAuthManager();
export default firebaseAuthManager;
