export function setupVoterData() {
    // --- Eligibility Checker ---
    window.checkEligibility = function() {
        const ageCheck = document.getElementById('age-check').checked;
        const citizenCheck = document.getElementById('citizen-check').checked;
        const residentCheck = document.getElementById('resident-check').checked;
        const crimeCheck = document.getElementById('crime-check').checked;
        const resultDiv = document.getElementById('eligibility-result');

        resultDiv.style.display = 'block';

        if (ageCheck && citizenCheck && residentCheck && crimeCheck) {
            resultDiv.style.backgroundColor = '#F0FDF4';
            resultDiv.style.border = '1px solid #4ADE80';
            resultDiv.style.color = '#15803D';
            resultDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <span style="font-size: 1.5rem;">✅</span>
                    <strong style="font-size: 1.1rem;">Congratulations!</strong>
                </div>
                <p style="margin: 0.5rem 0;">You are eligible to vote! Make sure you are registered in the electoral roll.</p>
            `;
        } else {
            const missing = [];
            if (!ageCheck) missing.push('Age requirement');
            if (!citizenCheck) missing.push('Citizenship');
            if (!residentCheck) missing.push('Residency');
            if (!crimeCheck) missing.push('No criminal conviction');

            resultDiv.style.backgroundColor = '#FEF2F2';
            resultDiv.style.border = '1px solid #F87171';
            resultDiv.style.color = '#B91C1C';
            resultDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <span style="font-size: 1.5rem;">❌</span>
                    <strong>Not Eligible</strong>
                </div>
                <p style="margin: 0.5rem 0;">Missing requirements: ${missing.join(', ')}</p>
            `;
        }
    };

    // --- Voter Verification Logic ---
    const verifyBtn = document.getElementById('verify-voter-btn');
    const voterIdInput = document.getElementById('voter-id-input');
    const partNoInput = document.getElementById('part-no-input');
    const resultDiv = document.getElementById('voter-result');

    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const voterId = voterIdInput.value.trim().toUpperCase();
            const partNo = partNoInput.value.trim();

            if (!voterId || !partNo) {
                resultDiv.style.display = 'block';
                resultDiv.style.backgroundColor = '#FEF2F2';
                resultDiv.style.border = '1px solid #F87171';
                resultDiv.style.color = '#B91C1C';
                resultDiv.innerHTML = `<p style="margin: 0;">Please enter both Voter ID and Part Number.</p>`;
                return;
            }

            try {
                verifyBtn.disabled = true;
                verifyBtn.textContent = 'Checking...';
                
                // Fetch mock data
                const response = await fetch('./voter_db.json');
                const data = await response.json();
                const voter = data.find(v => v.voterId === voterId && v.partNo === partNo);

                resultDiv.style.display = 'block';
                if (voter) {
                    if (voter.status === 'Registered') {
                        resultDiv.style.backgroundColor = '#F0FDF4';
                        resultDiv.style.border = '1px solid #4ADE80';
                        resultDiv.style.color = '#15803D';
                        let successHtml = `
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <span style="font-size: 1.25rem;">✅</span>
                                <strong style="font-size: 1.1rem;">Verified</strong>
                            </div>
                            <p style="margin: 0.25rem 0;"><strong>Name:</strong> ${voter.name}</p>
                            <p style="margin: 0.25rem 0;"><strong>Polling Station:</strong> ${voter.pollingStation}</p>
                        `;

                        try {
                            const candResponse = await fetch('./candidates_db.json');
                            const candData = await candResponse.json();
                            const partData = candData.find(p => p.partNo === partNo);

                            if (partData && partData.candidates && partData.candidates.length > 0) {
                                successHtml += `<hr style="border: 0; border-top: 1px solid #86EFAC; margin: 1rem 0;">`;
                                successHtml += `<p style="margin-bottom: 0.5rem; color: #166534;"><strong>Candidates in your constituency (${partData.constituency}):</strong></p>`;
                                successHtml += `<div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">`;
                                partData.candidates.forEach(c => {
                                    successHtml += `
                                        <div style="display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.5); padding: 0.5rem; border-radius: 6px;">
                                            <div style="background: white; padding: 0.1rem; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.1); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                                                <img src="${c.logo}" alt="${c.symbol}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                            </div>
                                            <div style="font-size: 0.9rem; line-height: 1.2;">
                                                <strong>${c.name}</strong> <span style="font-size: 0.8rem; color: #15803D;">(${c.party.split('(')[1] ? c.party.split('(')[1].replace(')','') : c.party})</span>
                                            </div>
                                        </div>
                                    `;
                                });
                                successHtml += `</div>`;
                            }
                        } catch(e) {
                            console.error("Could not load local candidates info", e);
                        }

                        resultDiv.innerHTML = successHtml;
                    } else {
                        resultDiv.style.backgroundColor = '#FEF2F2';
                        resultDiv.style.border = '1px solid #F87171';
                        resultDiv.style.color = '#B91C1C';
                        resultDiv.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.25rem;">❌</span>
                                <strong>Record not found.</strong>
                            </div>
                        `;
                    }
                } else {
                    resultDiv.style.backgroundColor = '#FEF2F2';
                    resultDiv.style.border = '1px solid #F87171';
                    resultDiv.style.color = '#B91C1C';
                    resultDiv.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-size: 1.25rem;">❌</span>
                            <strong>Record not found for given details.</strong>
                        </div>
                    `;
                }

            } catch (error) {
                console.error("Error fetching voter data:", error);
                resultDiv.style.display = 'block';
                resultDiv.style.backgroundColor = '#FEF2F2';
                resultDiv.style.border = '1px solid #F87171';
                resultDiv.style.color = '#B91C1C';
                resultDiv.innerHTML = `<p style="margin: 0;">Service unavailable. Please try again later.</p>`;
            } finally {
                verifyBtn.disabled = false;
                const lang = document.getElementById('lang-selector') ? document.getElementById('lang-selector').value : 'en';
                verifyBtn.textContent = lang === 'en' ? 'Verify Status' : (lang === 'hi' ? 'स्थिति सत्यापित करें' : 'স্ট্যাটাস যাচাই করুন');
            }
        });
    }

    // --- Candidate Lookup Logic ---
    const searchCandidateBtn = document.getElementById('search-candidate-btn');
    const candidateConstSelect = document.getElementById('candidate-constituency-select');
    const candidateResultDiv = document.getElementById('candidate-result');

    if (searchCandidateBtn) {
        searchCandidateBtn.addEventListener('click', async () => {
            const partNo = candidateConstSelect.value;

            if (!partNo) {
                candidateResultDiv.style.display = 'block';
                candidateResultDiv.style.backgroundColor = '#FEF2F2';
                candidateResultDiv.style.border = '1px solid #F87171';
                candidateResultDiv.style.color = '#B91C1C';
                candidateResultDiv.style.padding = '1rem';
                candidateResultDiv.innerHTML = `<p style="margin: 0;">Please select a Constituency.</p>`;
                return;
            }

            try {
                searchCandidateBtn.disabled = true;
                searchCandidateBtn.textContent = 'Searching...';
                
                const response = await fetch('./candidates_db.json');
                const data = await response.json();
                const partData = data.find(p => p.partNo === partNo);

                candidateResultDiv.style.display = 'block';
                candidateResultDiv.style.padding = '1rem';
                candidateResultDiv.style.borderRadius = '8px';
                candidateResultDiv.style.backgroundColor = 'rgba(255,255,255,0.05)';
                candidateResultDiv.style.border = '1px solid var(--glass-border)';
                candidateResultDiv.style.color = 'var(--text-primary)';

                if (partData && partData.candidates && partData.candidates.length > 0) {
                    let html = `<h5 style="margin-bottom: 1rem; color: var(--primary-color);">Candidates for ${partData.constituency}</h5>`;
                    html += `<div style="display: flex; flex-direction: column; gap: 1rem;">`;
                    partData.candidates.forEach(c => {
                        html += `
                            <div style="background: rgba(0,0,0,0.1); padding: 1rem; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                    <strong style="font-size: 1.1rem;">${c.name}</strong>
                                    <div style="background: white; padding: 0.2rem; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                        <img src="${c.logo}" alt="${c.symbol}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                    </div>
                                </div>
                                <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);"><strong>Party:</strong> ${c.party}</p>
                                <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;"><em>"${c.promise}"</em></p>
                            </div>
                        `;
                    });
                    html += `</div>`;
                    candidateResultDiv.innerHTML = html;
                } else {
                    candidateResultDiv.innerHTML = `<p style="margin: 0;">No candidates found for Part No ${partNo}.</p>`;
                }

            } catch (error) {
                console.error("Error fetching candidates data:", error);
                candidateResultDiv.style.display = 'block';
                candidateResultDiv.style.padding = '1rem';
                candidateResultDiv.innerHTML = `<p style="margin: 0; color: #B91C1C;">Service unavailable. Please try again later.</p>`;
            } finally {
                searchCandidateBtn.disabled = false;
                const lang = document.getElementById('lang-selector') ? document.getElementById('lang-selector').value : 'en';
                searchCandidateBtn.textContent = lang === 'en' ? 'Search' : (lang === 'hi' ? 'खोजें' : 'অনুসন্ধান করুন');
            }
        });
    }

    // --- Personalized Voter Guidance ---
    window.getPersonalizedGuidance = function() {
        const priority = document.getElementById('priority-select').value;
        const constituency = document.getElementById('guidance-constituency').value;
        const resultDiv = document.getElementById('guidance-result');

        if (!priority || !constituency) {
            resultDiv.style.display = 'block';
            resultDiv.style.backgroundColor = '#FEF2F2';
            resultDiv.style.color = '#B91C1C';
            resultDiv.innerHTML = '<p>Please select both priority and constituency.</p>';
            return;
        }

        const guidanceData = {
            'education-159': {
                priority: 'Education',
                candidates: [
                    { name: 'Mamata Banerjee', alignment: '85%', reason: 'Strong focus on school infrastructure and teacher welfare programs' },
                    { name: 'Suvendu Adhikari', alignment: '65%', reason: 'Supports education modernization but less on infrastructure' },
                    { name: 'Adv. Srijeeb Biswas', alignment: '90%', reason: 'Advocates for comprehensive educational reform and access' }
                ]
            },
            'health-159': {
                priority: 'Healthcare',
                candidates: [
                    { name: 'Mamata Banerjee', alignment: '75%', reason: 'Expanded state healthcare schemes and hospital network' },
                    { name: 'Suvendu Adhikari', alignment: '70%', reason: 'Promotes private-public partnership in healthcare' },
                    { name: 'Adv. Srijeeb Biswas', alignment: '88%', reason: 'Advocates for accessible healthcare for all citizens' }
                ]
            },
            'economy-159': {
                priority: 'Economy & Jobs',
                candidates: [
                    { name: 'Mamata Banerjee', alignment: '72%', reason: 'Focus on MSME support and local business growth' },
                    { name: 'Suvendu Adhikari', alignment: '85%', reason: 'Strong track record on industrial development' },
                    { name: 'Adv. Srijeeb Biswas', alignment: '70%', reason: 'Advocates for worker welfare and job creation' }
                ]
            }
        };

        const key = `${priority.toLowerCase()}-${constituency}`;
        const guidance = guidanceData[key] || {
            priority: priority,
            candidates: [
                { name: 'Candidate A', alignment: '75%', reason: 'Good match for your priorities' },
                { name: 'Candidate B', alignment: '60%', reason: 'Moderate alignment with your interests' }
            ]
        };

        resultDiv.style.display = 'block';
        resultDiv.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';
        resultDiv.style.color = 'var(--text-primary)';

        let html = `
            <div style="margin-bottom: 1rem;">
                <h4>Personalized Analysis for: <strong>${guidance.priority}</strong></h4>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">Based on your priority and candidate positions</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        `;

        guidance.candidates.forEach((candidate) => {
            const alignmentNum = parseInt(candidate.alignment);
            const color = alignmentNum >= 80 ? '#10B981' : alignmentNum >= 70 ? '#F59E0B' : '#EF4444';

            html += `
                <div style="background: rgba(0,0,0,0.05); padding: 0.75rem; border-radius: 8px; border-left: 4px solid ${color};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <strong>${candidate.name}</strong>
                        <span style="background: ${color}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">${candidate.alignment}</span>
                    </div>
                    <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">${candidate.reason}</p>
                </div>
            `;
        });

        html += '</div>';
        resultDiv.innerHTML = html;
    };
}
