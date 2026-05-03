import { getVerifiedNews } from '../services/publicData.js';

export const NewsView = {
    render() {
        return `
        <div class="container page-shell" style="padding-top: 100px; min-height: 80dvh;">
            <div class="section-header text-center">
                <h2 style="color: var(--primary-color);">News & Alerts</h2>
                <p>Only verified election updates from configured trusted sources are shown.</p>
            </div>
            
            <div style="margin-bottom: 2rem; border-radius: 16px; overflow: hidden; box-shadow: var(--glass-shadow);">
                <img src="./news_banner_1777823626093.png" alt="News Banner" style="width: 100%; max-height: 300px; object-fit: cover;">
            </div>

            <div class="responsive-split" style="display: flex; gap: 2rem; flex-wrap: wrap;">
                
                <!-- Main Feed -->
                <div style="flex: 2; min-width: 0;">
                    <h3 style="margin-bottom: 1.5rem;">Live Updates</h3>
                    <div id="verified-news-container" class="glass-card">Loading verified news...</div>
                </div>

                <!-- Sidebar -->
                <div style="flex: 1; min-width: 0;">
                    <div class="glass-card" style="margin-bottom: 1.5rem;">
                        <h4 style="margin-bottom: 1rem;">Verification Status</h4>
                        <p id="verified-news-status" style="font-size: 0.9rem; margin-bottom: 0;">Checking source availability...</p>
                    </div>
                    
                    <div class="glass-card">
                        <h4 style="margin-bottom: 1rem;">Official References</h4>
                        <ul class="feature-list">
                            <li><a href="https://eci.gov.in/" target="_blank" rel="noopener noreferrer">Election Commission of India</a></li>
                            <li><a href="https://voters.eci.gov.in/" target="_blank" rel="noopener noreferrer">NVSP</a></li>
                            <li><a href="https://www.data.gov.in/" target="_blank" rel="noopener noreferrer">Data.gov.in</a></li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
        `;
    },

    async mount() {
        const container = document.getElementById('verified-news-container');
        const status = document.getElementById('verified-news-status');
        if (!container || !status) return;

        try {
            const payload = await getVerifiedNews();
            if (!payload.verified || !Array.isArray(payload.items) || payload.items.length === 0) {
                container.innerHTML = '<p>Live data currently unavailable</p>';
                status.textContent = 'Unverified: live provider unavailable.';
                return;
            }

            const cards = payload.items.slice(0, 8).map((item) => {
                const title = escapeHtml(item.title || item.headline || 'Untitled update');
                const summary = escapeHtml(item.summary || item.description || 'No summary available.');
                const sourceName = escapeHtml(item.source?.name || item.sourceName || payload.source || 'Verified source');
                const published = escapeHtml(item.publishedAt || item.date || payload.lastUpdated || '');
                const sourceUrl = item.url || item.link || payload.source;
                return `
                  <div class="glass-card" style="margin-bottom: 1rem; border-left: 4px solid var(--success-color);">
                    <span class="badge" style="background: rgba(16,185,129,0.12); color:#10B981;">VERIFIED</span>
                    <h4 style="margin-top: 0.6rem; margin-bottom: 0.4rem;">${title}</h4>
                    <p style="font-size:0.9rem; color: var(--text-secondary); margin-bottom:0.6rem;">${published} | ${sourceName}</p>
                    <p style="margin-bottom:0.5rem;">${summary}</p>
                    ${sourceUrl ? `<a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">View source</a>` : ''}
                  </div>
                `;
            }).join('');
            container.innerHTML = cards;
            status.textContent = `Verified feed active. Last updated: ${new Date(payload.lastUpdated).toLocaleString()}`;
        } catch (error) {
            console.error('[News] Verified feed failed', error);
            container.innerHTML = '<p>Live data currently unavailable</p>';
            status.textContent = 'Unverified: source fetch error.';
        }
    }
};

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text || '');
    return div.innerHTML;
}
