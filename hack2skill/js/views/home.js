import { setupNavigation } from '../ui/navigation.js';

export const HomeView = {
    render() {
        return `
        <section id="hero" class="hero-section container">
            <div class="hero-content">
                <div class="badge" data-i18n="hero_badge">Election Guide 2026</div>
                <h1 class="gradient-text" data-i18n="hero_title">Your Voice. Your Vote. Our Future.</h1>
                <p data-i18n="hero_desc">Navigate the election process with ease. Understand timelines, prepare your documents, and cast your vote confidently with our interactive assistant.</p>
                
                <!-- Countdown Timer -->
                <div class="countdown-container glass-card" style="margin-bottom: 2rem; display: flex; gap: 1rem; justify-content: space-between; text-align: center;">
                    <div><h3 id="cd-days" style="margin:0; color:var(--primary-color);">45</h3><span style="font-size:0.8rem; color:var(--text-secondary);">Days</span></div>
                    <div><h3 id="cd-hours" style="margin:0; color:var(--primary-color);">12</h3><span style="font-size:0.8rem; color:var(--text-secondary);">Hours</span></div>
                    <div><h3 id="cd-mins" style="margin:0; color:var(--primary-color);">30</h3><span style="font-size:0.8rem; color:var(--text-secondary);">Mins</span></div>
                </div>

                <div class="hero-actions">
                    <button class="btn btn-primary" onclick="document.getElementById('steps').scrollIntoView({behavior: 'smooth'})" data-i18n="btn_start">Get Started</button>
                    <button class="btn btn-secondary" onclick="document.getElementById('timeline').scrollIntoView({behavior: 'smooth'})" data-i18n="btn_timeline">View Timeline</button>
                </div>
            </div>
            <div class="hero-visual">
                <img src="./hero_bg_1777822890160.png" alt="Election Platform" style="width: 100%; max-width: 500px; border-radius: 20px; box-shadow: var(--glass-shadow); transform: rotateY(-15deg) rotateX(5deg); transition: transform 0.5s ease;" onmouseover="this.style.transform='rotateY(0) rotateX(0)'" onmouseout="this.style.transform='rotateY(-15deg) rotateX(5deg)'">
            </div>
        </section>

        <section id="timeline" class="timeline-section container">
            <div class="section-header text-center">
                <h2 data-i18n="timeline_h2">The Election Timeline</h2>
                <p data-i18n="timeline_p">A comprehensive overview of how an election unfolds from start to finish.</p>
            </div>
            
            <div class="interactive-timeline">
                <div class="timeline-nav">
                    <button class="timeline-btn active" data-phase="1" data-i18n="btn_prep">Preparation</button>
                    <button class="timeline-btn" data-phase="2" data-i18n="btn_camp">Campaigns</button>
                    <button class="timeline-btn" data-phase="3" data-i18n="btn_vote">Voting</button>
                    <button class="timeline-btn" data-phase="4" data-i18n="btn_res">Results</button>
                </div>
                
                <div class="timeline-content-container glass-card">
                    <div class="timeline-phase active" id="phase-1">
                        <div class="phase-icon">📝</div>
                        <div class="phase-details" style="flex: 1;">
                            <h3 data-i18n="p1_h3">Preparation & Registration</h3>
                            <p class="phase-date" data-i18n="p1_date">Months before Election Day</p>
                            <p class="phase-desc" data-i18n="p1_desc">This is the critical foundational phase. Electoral rolls are updated, election dates are announced by the electoral commission, and eligible citizens must ensure they are registered to vote.</p>
                            <ul class="feature-list">
                                <li data-i18n="p1_li1">Voter registration drives</li>
                                <li data-i18n="p1_li2">Announcement of election schedule</li>
                                <li data-i18n="p1_li3">Filing of nominations by candidates</li>
                            </ul>
                        </div>
                        <div class="phase-image" style="flex: 1; display: flex; align-items: center; justify-content: center;">
                            <img src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=500" alt="Indian citizens filling out voter registration forms" style="width: 100%; border-radius: 12px; object-fit: cover; max-height: 250px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                        </div>
                    </div>
                    
                    <div class="timeline-phase" id="phase-2">
                        <div class="phase-icon">📢</div>
                        <div class="phase-details" style="flex: 1;">
                            <h3 data-i18n="p2_h3">Campaigning Period</h3>
                            <p class="phase-date" data-i18n="p2_date">Weeks leading up to the election</p>
                            <p class="phase-desc" data-i18n="p2_desc">Candidates and political parties actively campaign to share their platforms, debate issues, and win voter support. This period usually has strict spending and behavioral guidelines.</p>
                            <ul class="feature-list">
                                <li data-i18n="p2_li1">Public rallies and debates</li>
                                <li data-i18n="p2_li2">Release of party manifestos</li>
                                <li data-i18n="p2_li3">Campaigning stops 48 hours before voting</li>
                            </ul>
                        </div>
                        <div class="phase-image" style="flex: 1; display: flex; align-items: center; justify-content: center;">
                            <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=500" alt="Colorful political campaign rally in India" style="width: 100%; border-radius: 12px; object-fit: cover; max-height: 250px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                        </div>
                    </div>
                    
                    <div class="timeline-phase" id="phase-3">
                        <div class="phase-icon">🗳️</div>
                        <div class="phase-details" style="flex: 1;">
                            <h3 data-i18n="p3_h3">Voting Days</h3>
                            <p class="phase-date" data-i18n="p3_date">Election Day(s)</p>
                            <p class="phase-desc" data-i18n="p3_desc">Registered voters go to polling stations to cast their ballots. Many regions also offer early voting or mail-in voting for accessibility.</p>
                            <ul class="feature-list">
                                <li data-i18n="p3_li1">Polling booths open at designated times</li>
                                <li data-i18n="p3_li2">Identity verification of voters</li>
                                <li data-i18n="p3_li3">Secret ballot voting process</li>
                            </ul>
                        </div>
                        <div class="phase-image" style="flex: 1; display: flex; align-items: center; justify-content: center;">
                            <img src="./voting_queue.png" alt="Indian voters standing in a line outside a polling station" style="width: 100%; border-radius: 12px; object-fit: cover; max-height: 250px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                        </div>
                    </div>
                    
                    <div class="timeline-phase" id="phase-4">
                        <div class="phase-icon">📊</div>
                        <div class="phase-details" style="flex: 1;">
                            <h3 data-i18n="p4_h3">Results & Transition</h3>
                            <p class="phase-date" data-i18n="p4_date">Post-Election</p>
                            <p class="phase-desc" data-i18n="p4_desc">Votes are counted under strict supervision. Results are officially declared, leading to the formation of the new government or the swearing-in of elected officials.</p>
                            <ul class="feature-list">
                                <li data-i18n="p4_li1">Secure counting of ballots</li>
                                <li data-i18n="p4_li2">Official declaration of winners</li>
                                <li data-i18n="p4_li3">Transition of power</li>
                            </ul>
                        </div>
                        <div class="phase-image" style="flex: 1; display: flex; align-items: center; justify-content: center;">
                            <img src="https://images.unsplash.com/photo-1575505586569-646b2ca898fc?auto=format&fit=crop&q=80&w=500" alt="Indian citizens celebrating election results" style="width: 100%; border-radius: 12px; object-fit: cover; max-height: 250px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="steps" class="steps-section container">
            <div class="section-header">
                <h2 data-i18n="steps_h2">Your Step-by-Step Guide</h2>
                <p data-i18n="steps_p">Follow these steps to ensure your voice is heard.</p>
            </div>
            
            <div class="wizard-container">
                <div class="wizard-progress">
                    <div class="wizard-step-indicator active" data-step="1">1</div>
                    <div class="wizard-line"></div>
                    <div class="wizard-step-indicator" data-step="2">2</div>
                    <div class="wizard-line"></div>
                    <div class="wizard-step-indicator" data-step="3">3</div>
                    <div class="wizard-line"></div>
                    <div class="wizard-step-indicator" data-step="4">4</div>
                </div>
                
                <div class="wizard-panels">
                    <div class="wizard-panel active" id="step-1">
                        <div class="glass-card panel-content">
                            <div style="display: flex; gap: 2rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
                                <div style="flex: 1; min-width: 250px;">
                                    <h3 data-i18n="s1_h3">Step 1: Check Eligibility & Register</h3>
                                    <p data-i18n="s1_p">Before you can vote, you must ensure you meet the basic requirements and are officially registered in the electoral roll.</p>
                                    <div class="checklist">
                                        <label class="checkbox-container">
                                            <input type="checkbox">
                                            <span class="checkmark"></span>
                                            <span data-i18n="s1_cb1">Meet the minimum age requirement (usually 18)</span>
                                        </label>
                                        <label class="checkbox-container">
                                            <input type="checkbox">
                                            <span class="checkmark"></span>
                                            <span data-i18n="s1_cb2">Have valid citizenship</span>
                                        </label>
                                        <label class="checkbox-container">
                                            <input type="checkbox">
                                            <span class="checkmark"></span>
                                            <span data-i18n="s1_cb3">Submit voter registration application before the deadline</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="wizard-actions">
                                <div></div>
                                <button class="btn btn-primary next-btn" data-i18n="btn_next">Next Step &rarr;</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="wizard-panel" id="step-2">
                        <div class="glass-card panel-content">
                            <div style="display: flex; gap: 2rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
                                <div style="flex: 1; min-width: 250px;">
                                    <h3 data-i18n="s2_h3">Step 2: Know Your Candidates</h3>
                                    <p data-i18n="s2_p">An informed voter is a powerful voter. Take time to research who is running and what they stand for.</p>
                                    <button class="btn btn-outline" onclick="window.location.hash='#/candidates'">Explore Candidates Directory</button>
                                </div>
                            </div>
                            <div class="wizard-actions">
                                <button class="btn btn-outline prev-btn" data-i18n="btn_back">&larr; Back</button>
                                <button class="btn btn-primary next-btn" data-i18n="btn_next">Next Step &rarr;</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="wizard-panel" id="step-3">
                        <div class="glass-card panel-content">
                            <h3 data-i18n="s3_h3">Step 3: Prepare for Election Day</h3>
                            <p data-i18n="s3_p">Don't wait until the last minute. Plan your voting day to ensure a smooth experience.</p>
                            <ul class="bullet-list">
                                <li data-i18n="s3_li1"><strong>Find your polling place:</strong> Check your official election authority website for your assigned location.</li>
                                <li data-i18n="s3_li2"><strong>Check the hours:</strong> Know exactly when the polls open and close.</li>
                            </ul>
                            <button class="btn btn-outline" onclick="document.getElementById('booth-modal').style.display='block'">Use Polling Booth Locator</button>
                            <div class="wizard-actions">
                                <button class="btn btn-outline prev-btn" data-i18n="btn_back">&larr; Back</button>
                                <button class="btn btn-primary next-btn" data-i18n="btn_next">Next Step &rarr;</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="wizard-panel" id="step-4">
                        <div class="glass-card panel-content">
                            <div style="display: flex; gap: 2rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
                                <div style="flex: 1; min-width: 250px;">
                                    <h3 data-i18n="s4_h3">Step 4: Cast Your Vote</h3>
                                    <p data-i18n="s4_p">You're ready! Go to your polling place and make your choice.</p>
                                    <div class="success-box" style="padding: 1rem; margin-top: 1rem;">
                                        <div class="success-icon" style="font-size: 3rem; margin-bottom: 0.5rem;">🎉</div>
                                        <p data-i18n="s4_succ">Once you've marked your ballot and submitted it, you have successfully participated in the democratic process!</p>
                                    </div>
                                </div>
                                <div style="flex: 1; min-width: 250px; display: flex; align-items: center; justify-content: center;">
                                    <img src="./voting_machine.png" alt="Casting vote on an Indian EVM" style="width: 100%; border-radius: 12px; object-fit: cover; max-height: 250px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                                </div>
                            </div>
                            <div class="wizard-actions">
                                <button class="btn btn-outline prev-btn" data-i18n="btn_back">&larr; Back</button>
                                <button class="btn btn-success" onclick="alert('You are ready to vote!')" data-i18n="btn_finish">Finish</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Tools Section -->
        <section id="tools" class="tools-section container">
            <div class="section-header text-center">
                <h2 data-i18n="tools_h2">Election Tools & Resources</h2>
                <p data-i18n="tools_p">Access all the tools you need for informed voting.</p>
            </div>

            <div class="tools-grid">
                <!-- Eligibility Checker Card -->
                <div class="tool-card glass-card">
                    <div class="tool-icon">✅</div>
                    <h3 data-i18n="tool_eligibility">Eligibility Checker</h3>
                    <p data-i18n="tool_eligibility_desc">Check if you meet all requirements to vote.</p>
                    <button class="btn btn-primary btn-sm" onclick="document.getElementById('eligibility-modal').style.display='block'">Open Tool</button>
                </div>

                <!-- Polling Booth Locator Card -->
                <div class="tool-card glass-card">
                    <div class="tool-icon">📍</div>
                    <h3 data-i18n="tool_polling">Polling Booth Locator</h3>
                    <p data-i18n="tool_polling_desc">Find your nearest polling station.</p>
                    <button class="btn btn-primary btn-sm" onclick="document.getElementById('booth-modal').style.display='block'">Open Tool</button>
                </div>

                <!-- Election Reminders Card -->
                <div class="tool-card glass-card">
                    <div class="tool-icon">🔔</div>
                    <h3 data-i18n="tool_reminder">Election Reminders</h3>
                    <p data-i18n="tool_reminder_desc">Get notifications for important dates.</p>
                    <button class="btn btn-primary btn-sm" onclick="document.getElementById('reminder-modal').style.display='block'">Set Reminder</button>
                </div>

                <!-- Personalized Guidance Card -->
                <div class="tool-card glass-card">
                    <div class="tool-icon">👤</div>
                    <h3 data-i18n="tool_guidance">Voter Guidance</h3>
                    <p data-i18n="tool_guidance_desc">Get personalized voting recommendations.</p>
                    <button class="btn btn-primary btn-sm" onclick="document.getElementById('guidance-modal').style.display='block'">Get Guidance</button>
                </div>

                <!-- Live Updates Card -->
                <div class="tool-card glass-card">
                    <div class="tool-icon">📡</div>
                    <h3 data-i18n="tool_updates">Live Election Updates</h3>
                    <p data-i18n="tool_updates_desc">Real-time election statistics and results.</p>
                    <button class="btn btn-primary btn-sm" onclick="window.location.hash='#/news'">View Updates</button>
                </div>

                <!-- Chatbot Card -->
                <div class="tool-card glass-card">
                    <div class="tool-icon">💬</div>
                    <h3 data-i18n="tool_chatbot">Election Assistant Bot</h3>
                    <p data-i18n="tool_chatbot_desc">Ask questions and get instant answers.</p>
                    <button class="btn btn-primary btn-sm" onclick="document.getElementById('chatbot-modal').style.display='block'">Open Chat</button>
                </div>
            </div>
        </section>

        <!-- FAQ Section -->
        <section id="faq" class="faq-section container">
            <div class="section-header text-center">
                <h2 data-i18n="faq_h2">Frequently Asked Questions</h2>
                <p data-i18n="faq_p">Find answers to common questions about voting.</p>
            </div>

            <div class="faq-container">
                <div class="faq-item glass-card">
                    <div class="faq-header">
                        <h4 data-i18n="faq_q1">What are the basic eligibility requirements?</h4>
                        <span class="faq-icon">+</span>
                    </div>
                    <div class="faq-content">
                        <p data-i18n="faq_a1">You must be at least 18 years old, an Indian citizen, and a resident of your constituency. You should not have been convicted of any serious crime.</p>
                    </div>
                </div>

                <div class="faq-item glass-card">
                    <div class="faq-header">
                        <h4 data-i18n="faq_q2">How do I register to vote?</h4>
                        <span class="faq-icon">+</span>
                    </div>
                    <div class="faq-content">
                        <p data-i18n="faq_a2">Visit the Election Commission website, fill out Form 6, and submit it to your local electoral officer along with proof of residence and identity.</p>
                    </div>
                </div>

                <div class="faq-item glass-card">
                    <div class="faq-header">
                        <h4 data-i18n="faq_q3">Can I vote if I'm out of town?</h4>
                        <span class="faq-icon">+</span>
                    </div>
                    <div class="faq-content">
                        <p data-i18n="faq_a3">Yes! You can apply for postal ballot or vote using ETPBS (Electronic Transfer of Postal Ballot System) if you'll be away during elections.</p>
                    </div>
                </div>

                <div class="faq-item glass-card">
                    <div class="faq-header">
                        <h4 data-i18n="faq_q4">What documents do I need to bring?</h4>
                        <span class="faq-icon">+</span>
                    </div>
                    <div class="faq-content">
                        <p data-i18n="faq_a4">Bring any government-issued ID (Voter ID, Aadhar, Passport, Driving License). You'll need to verify your identity at the polling booth.</p>
                    </div>
                </div>

                <div class="faq-item glass-card">
                    <div class="faq-header">
                        <h4 data-i18n="faq_q5">How long does voting take?</h4>
                        <span class="faq-icon">+</span>
                    </div>
                    <div class="faq-content">
                        <p data-i18n="faq_a5">The entire process usually takes 5-10 minutes. Go early in the morning or late afternoon to avoid long queues.</p>
                    </div>
                </div>

                <div class="faq-item glass-card">
                    <div class="faq-header">
                        <h4 data-i18n="faq_q6">Can I check election results online?</h4>
                        <span class="faq-icon">+</span>
                    </div>
                    <div class="faq-content">
                        <p data-i18n="faq_a6">Yes! Visit the official Election Commission website for live results, candidate information, and detailed statistics.</p>
                    </div>
                </div>
            </div>
        </section>
        `;
    },

    mount() {
        // Initialize timeline/wizard after HTML is injected
        setupNavigation();
        
        // Setup countdown logic
        const countdownTimer = setInterval(() => {
            const daysEl = document.getElementById('cd-days');
            const hoursEl = document.getElementById('cd-hours');
            const minsEl = document.getElementById('cd-mins');
            if (daysEl && hoursEl && minsEl) {
                let m = parseInt(minsEl.innerText) - 1;
                let h = parseInt(hoursEl.innerText);
                let d = parseInt(daysEl.innerText);
                
                if (m < 0) { m = 59; h -= 1; }
                if (h < 0) { h = 23; d -= 1; }
                
                minsEl.innerText = m;
                hoursEl.innerText = h;
                daysEl.innerText = d;
            } else {
                clearInterval(countdownTimer);
            }
        }, 60000);
    }
};
