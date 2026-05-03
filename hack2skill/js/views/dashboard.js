import { store } from '../store.js';
import { getOfficialGuidance, getVerifiedSchedule } from '../services/publicData.js';

export const DashboardView = {
    render() {
        const user = store.state.currentUser;
        
        if (!user) {
            return `
            <div class="container page-shell" style="padding-top: 100px; text-align: center; min-height: 80dvh;">
                <h2>Please Login</h2>
                <button class="btn btn-primary" onclick="window.location.hash='#/'">Return Home</button>
            </div>`;
        }

        return `
        <div class="container page-shell" style="padding-top: 100px; min-height: 80dvh;">
            <div class="section-header">
                <h2>Welcome, ${user.name}</h2>
                <p>Your personalized election dashboard.</p>
            </div>
            
            <div class="dashboard-layout" style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
                <!-- Profile Sidebar -->
                <div class="glass-card" style="align-self: start;">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <div style="width: 80px; height: 80px; background: var(--primary-color); border-radius: 50%; margin: 0 auto 1rem auto; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: bold;">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                        <h3>${user.name}</h3>
                        <span class="badge">Verified Voter</span>
                    </div>
                    
                    <h4>Voting Progress</h4>
                    <div class="progress-bar-container" style="margin-top: 0.5rem; margin-bottom: 1.5rem;">
                        <div class="progress-bar" style="width: 75%;"></div>
                    </div>
                    <ul class="feature-list">
                        <li>Registered (Verified)</li>
                        <li>Candidate Research (In Progress)</li>
                        <li style="color: var(--text-secondary);">Vote Cast (Pending)</li>
                    </ul>
                    
                    <button class="btn btn-outline" style="width: 100%; margin-top: 2rem;" onclick="logout()">Sign Out</button>
                </div>
                
                <!-- Dashboard Content -->
                <div>
                    <h3 style="margin-bottom: 1rem;">Saved Candidates</h3>
                    ${store.state.savedCandidates.length > 0 ? `
                        <div class="saved-candidates-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            ${store.state.savedCandidates.map(c => `
                                <div class="glass-card" style="padding: 1rem; display: flex; align-items: center; gap: 1rem;">
                                    <div style="width: 40px; height: 40px; background: rgba(0,0,0,0.1); border-radius: 50%;"></div>
                                    <div>
                                        <strong>Candidate ${c}</strong>
                                        <p style="margin:0; font-size: 0.8rem;">Saved for review</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="glass-card" style="text-align: center; padding: 3rem;">
                            <img src="./empty_state_1777823032407.png" alt="Empty" style="width: 150px; margin-bottom: 1rem; opacity: 0.8;">
                            <h4>No saved candidates yet</h4>
                            <p>Explore the candidate directory to save profiles here.</p>
                            <button class="btn btn-primary" onclick="window.location.hash='#/candidates'">Explore Candidates</button>
                        </div>
                    `}
                    
                    <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Verified Election Data</h3>
                    <div class="glass-card" id="verified-dashboard-data">
                        <p>Loading verified schedule and guidance...</p>
                    </div>
                </div>
            </div>
        </div>
        `;
    },
    
    mount() {
        window.logout = () => {
            store.logout();
            window.location.hash = '#/';
        };

        const container = document.getElementById('verified-dashboard-data');
        if (!container) return;
        Promise.all([getVerifiedSchedule(), getOfficialGuidance()])
            .then(([schedule, guidance]) => {
                const scheduleRows = (schedule?.verified && Array.isArray(schedule.items) && schedule.items.length > 0)
                    ? schedule.items.slice(0, 4).map((item) => `
                        <li><strong>${escapeHtml(item.title || item.phase || 'Schedule item')}</strong> - ${escapeHtml(item.date || item.startDate || 'Date not provided')}</li>
                      `).join('')
                    : '<li>Live data currently unavailable</li>';

                const guidanceRows = Array.isArray(guidance?.items) && guidance.items.length > 0
                    ? guidance.items.slice(0, 3).map((item) => `
                        <li>${escapeHtml(item.title || 'Official guidance')} ${item.source ? `<a href="${item.source}" target="_blank" rel="noopener noreferrer">source</a>` : ''}</li>
                      `).join('')
                    : '<li>Live data currently unavailable</li>';

                container.innerHTML = `
                    <span class="badge" style="background: rgba(16,185,129,0.12); color:#10B981;">VERIFIED FLOW</span>
                    <p style="margin-top: 0.7rem; font-size: 0.9rem; color: var(--text-secondary);">Last updated: ${new Date(schedule?.lastUpdated || guidance?.lastUpdated || Date.now()).toLocaleString()}</p>
                    <h4 style="margin-top: 0.7rem;">Schedule</h4>
                    <ul class="feature-list">${scheduleRows}</ul>
                    <h4 style="margin-top: 1rem;">Official Guidance</h4>
                    <ul class="feature-list">${guidanceRows}</ul>
                `;
            })
            .catch((error) => {
                console.error('[Dashboard] Verified data fetch failed', error);
                container.innerHTML = '<p>Live data currently unavailable</p>';
            });
    }
};

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text || '');
    return div.innerHTML;
}
