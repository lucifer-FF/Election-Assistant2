// Centralized State Management and Mock Backend

export const store = {
    state: {
        currentUser: null, // { id: 1, name: 'John Doe', role: 'user' }
        language: 'en',
        theme: 'light',
        reminders: [],
        savedCandidates: []
    },

    init() {
        const savedState = localStorage.getItem('electAssistState');
        if (savedState) {
            this.state = { ...this.state, ...JSON.parse(savedState) };
        }
        
        // Mock session check
        const session = sessionStorage.getItem('mockSession');
        if (session) {
            this.state.currentUser = JSON.parse(session);
        }
    },

    save() {
        localStorage.setItem('electAssistState', JSON.stringify({
            language: this.state.language,
            theme: this.state.theme,
            reminders: this.state.reminders,
            savedCandidates: this.state.savedCandidates
        }));
    },

    login(username, password) {
        // Mock authentication
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (username === 'admin' && password === 'admin123') {
                    const user = { id: 0, name: 'Administrator', role: 'admin' };
                    this.state.currentUser = user;
                    sessionStorage.setItem('mockSession', JSON.stringify(user));
                    resolve(user);
                } else if (username && password) {
                    const user = { id: 1, name: username, role: 'user' };
                    this.state.currentUser = user;
                    sessionStorage.setItem('mockSession', JSON.stringify(user));
                    resolve(user);
                } else {
                    reject(new Error("Invalid credentials"));
                }
            }, 500);
        });
    },

    logout() {
        this.state.currentUser = null;
        sessionStorage.removeItem('mockSession');
    },

    saveCandidate(candidateId) {
        if (!this.state.savedCandidates.includes(candidateId)) {
            this.state.savedCandidates.push(candidateId);
            this.save();
        }
    },
    
    setTheme(theme) {
        this.state.theme = theme;
        this.save();
        document.body.setAttribute('data-theme', theme);
    }
};

store.init();
