import { store } from '../store.js';
import { getVerifiedCandidates } from '../services/publicData.js';

export const CandidatesView = {
    render() {
        return `
        <div class="container page-shell" style="padding-top: 100px; min-height: 80dvh;">
            <div class="section-header text-center">
                <h2 style="color: var(--primary-color);">Candidate Comparison</h2>
                <p>Candidate data is displayed only when verified from configured official datasets/APIs.</p>
            </div>
            
            <div class="candidate-filter-row" style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;">
                <input type="text" id="cand-search" placeholder="Search by constituency or candidate..." style="flex: 2; min-width: 0; padding: 0.8rem; border: 1px solid var(--glass-border); border-radius: 8px; background: var(--glass-bg); color: var(--text-primary);">
                <select id="constituency-filter" style="flex: 1; min-width: 0; padding: 0.8rem; border: 1px solid var(--glass-border); border-radius: 8px; background: var(--glass-bg); color: var(--text-primary);">
                    <option value="">All Constituencies</option>
                </select>
                <button class="btn btn-primary" onclick="searchCompare()">Search</button>
            </div>

            <!-- Side by Side Comparison -->
            <div class="comparison-grid-responsive" style="display: flex; gap: 2rem; flex-wrap: wrap; justify-content: space-between;" id="comparison-grid">
                <div class="glass-card" style="width: 100%;">
                    <p>Loading verified candidate data...</p>
                </div>
            </div>
        </div>
        `;
    },

    mount() {
        window.saveCand = (name) => {
            if (!store.state.currentUser) {
                alert("Please login to save candidates.");
                return;
            }
            store.saveCandidate(name);
            alert(`${name} saved to your dashboard!`);
        };
        
        const runSearch = async () => {
            const grid = document.getElementById('comparison-grid');
            const query = document.getElementById('cand-search')?.value?.trim() || '';
            const constituency = document.getElementById('constituency-filter')?.value || '';
            if (!grid) return;
            grid.innerHTML = '<div class="glass-card" style="width:100%;"><p>Loading verified candidate data...</p></div>';

            try {
                const payload = await getVerifiedCandidates(constituency || query);
                if (!payload.verified || !Array.isArray(payload.items) || payload.items.length === 0) {
                    grid.innerHTML = `
                        <div class="glass-card" style="width: 100%;">
                            <span class="badge" style="background: rgba(239, 68, 68, 0.1); color: #EF4444;">UNVERIFIED</span>
                            <h4 style="margin-top: 0.8rem;">Live data currently unavailable</h4>
                            <p>No verified candidate records are currently available for this query.</p>
                        </div>
                    `;
                    return;
                }

                grid.innerHTML = payload.items.slice(0, 8).map((candidate) => {
                    const name = escapeHtml(candidate.name || candidate.candidateName || 'Unknown');
                    const party = escapeHtml(candidate.party || 'Not specified');
                    const constName = escapeHtml(candidate.constituency || 'Unknown constituency');
                    const sourceUrl = candidate.url || payload.source;
                    return `
                      <div class="glass-card" style="position: relative; overflow: hidden; flex: 1; min-width: 0;">
                        <div style="position: absolute; top:0; left:0; width: 100%; height: 8px; background: linear-gradient(90deg, #10B981, #34D399);"></div>
                        <div style="text-align: center; margin-bottom: 1rem; margin-top: 1rem;">
                          <div style="width: 72px; height: 72px; background: rgba(0,0,0,0.08); border-radius: 50%; margin: 0 auto 0.7rem auto; display:flex; align-items:center; justify-content:center;">👤</div>
                          <h3 style="margin-bottom: 0.2rem;">${name}</h3>
                          <span class="badge" style="background: rgba(16,185,129,0.12); color:#10B981;">VERIFIED</span>
                        </div>
                        <p style="margin-bottom:0.3rem;"><strong>Party:</strong> ${party}</p>
                        <p style="margin-bottom:0.7rem;"><strong>Constituency:</strong> ${constName}</p>
                        ${sourceUrl ? `<a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">View source</a>` : ''}
                        <button class="btn btn-outline" style="width: 100%; margin-top: 1rem;" onclick="saveCand('${name.replace(/'/g, "\\'")}')">Save to Dashboard</button>
                      </div>
                    `;
                }).join('');
            } catch (error) {
                console.error('[Candidates] Verified fetch failed', error);
                grid.innerHTML = '<div class="glass-card" style="width:100%;"><p>Live data currently unavailable</p></div>';
            }
        };

        window.searchCompare = runSearch;
        runSearch();
    }
};

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text || '');
    return div.innerHTML;
}
