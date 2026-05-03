import { store } from '../store.js';

export const AdminView = {
    render() {
        return `
        <div class="container page-shell" style="padding-top: 100px; min-height: 80dvh;">
            <div class="section-header admin-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="color: var(--primary-color);">Admin Dashboard</h2>
                    <p>Secure platform management and analytics.</p>
                </div>
                <button class="btn btn-outline" onclick="logout()">Exit Admin</button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div class="glass-card" style="text-align: center; padding: 1.5rem;">
                    <div style="font-size: 1.2rem; font-weight: 700; color: var(--primary-color);">Live data currently unavailable</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Active Users</div>
                </div>
                <div class="glass-card" style="text-align: center; padding: 1.5rem;">
                    <div style="font-size: 1.2rem; font-weight: 700; color: var(--secondary-color);">Live data currently unavailable</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Reminders Set</div>
                </div>
                <div class="glass-card" style="text-align: center; padding: 1.5rem;">
                    <div style="font-size: 1.2rem; font-weight: 700; color: var(--success-color);">Live data currently unavailable</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Eligibility Rate</div>
                </div>
                <div class="glass-card" style="text-align: center; padding: 1.5rem;">
                    <div style="font-size: 1.2rem; font-weight: 700; color: #F59E0B;">Live data currently unavailable</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Bot Queries/Hr</div>
                </div>
            </div>

            <div class="admin-main-grid" style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                <div class="glass-card">
                    <h3 style="margin-bottom: 1.5rem;">System Alerts & Moderation</h3>
                    <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3B82F6; padding: 1rem; margin-bottom: 1rem; border-radius: 4px;">
                        <strong>Data Integrity Mode</strong>
                        <p style="margin: 0; font-size: 0.9rem;">Unverified operational alerts are disabled. Only verified telemetry should be shown.</p>
                    </div>
                    
                    <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Recent Audit Logs</h3>
                    <div class="mobile-safe-table">
                    <table style="width: 100%; text-align: left; border-collapse: collapse; min-width: 420px;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--glass-border);">
                                <th style="padding: 0.5rem;">Time</th>
                                <th style="padding: 0.5rem;">Action</th>
                                <th style="padding: 0.5rem;">User ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid var(--glass-border);">
                                <td style="padding: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">--</td>
                                <td style="padding: 0.5rem;">Live audit feed unavailable</td>
                                <td style="padding: 0.5rem;">--</td>
                            </tr>
                        </tbody>
                    </table>
                    </div>
                </div>
                
                <div class="glass-card">
                    <h3 style="margin-bottom: 1rem;">Quick Actions</h3>
                    <button class="btn btn-outline" style="width: 100%; margin-bottom: 0.5rem;">Broadcast Alert</button>
                    <button class="btn btn-outline" style="width: 100%; margin-bottom: 0.5rem;">Update Candidates DB</button>
                    <button class="btn btn-outline" style="width: 100%; margin-bottom: 0.5rem;">Export User Data (CSV)</button>
                    <button class="btn btn-outline" style="width: 100%; margin-bottom: 0.5rem; border-color: #EF4444; color: #EF4444;">Purge Logs</button>
                </div>
            </div>
        </div>
        `;
    }
};
