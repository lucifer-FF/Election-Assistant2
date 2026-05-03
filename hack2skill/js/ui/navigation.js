export function setupNavigation() {
    // --- Smooth Scrolling for Navigation ---
    document.querySelectorAll('a[href^="#"]:not([href^="#/"])').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Subtle Entrance Animations ---
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply animation starting state to sections
    document.querySelectorAll('section:not(#hero)').forEach(section => {
        section.style.opacity = 0;
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(section);
    });

    // --- Interactive Timeline Logic ---
    const timelineBtns = document.querySelectorAll('.timeline-btn');
    const timelinePhases = document.querySelectorAll('.timeline-phase');

    timelineBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            timelineBtns.forEach(b => b.classList.remove('active'));
            timelinePhases.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const phaseId = `phase-${btn.getAttribute('data-phase')}`;
            document.getElementById(phaseId).classList.add('active');
        });
    });

    // --- Step Wizard Logic ---
    const wizardPanels = document.querySelectorAll('.wizard-panel');
    const stepIndicators = document.querySelectorAll('.wizard-step-indicator');
    const wizardLines = document.querySelectorAll('.wizard-line');
    
    document.querySelectorAll('.next-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (index < wizardPanels.length - 1) {
                goToStep(index + 1);
            }
        });
    });

    document.querySelectorAll('.prev-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            goToStep(index);
        });
    });

    function goToStep(targetIndex) {
        wizardPanels.forEach(panel => panel.classList.remove('active'));
        wizardPanels[targetIndex].classList.add('active');

        stepIndicators.forEach((indicator, idx) => {
            if (idx === targetIndex) {
                indicator.classList.add('active');
                indicator.classList.remove('completed');
            } else if (idx < targetIndex) {
                indicator.classList.remove('active');
                indicator.classList.add('completed');
                indicator.innerHTML = '✓';
            } else {
                indicator.classList.remove('active');
                indicator.classList.remove('completed');
                indicator.innerHTML = idx + 1;
            }
        });

        wizardLines.forEach((line, idx) => {
            if (idx < targetIndex) {
                line.classList.add('completed');
            } else {
                line.classList.remove('completed');
            }
        });
    }

    // --- Initialize FAQ Accordions ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item, index) => {
        const header = item.querySelector('.faq-header');
        if (header) {
            header.addEventListener('click', () => {
                faqItems.forEach((otherItem, otherIndex) => {
                    if (otherIndex !== index) {
                        otherItem.classList.remove('active');
                    }
                });
                item.classList.toggle('active');
            });
        }
    });
}

// Global functions for inline handlers
window.switchTab = function(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    if (event && event.target) {
        event.target.classList.add('active');
    }

    if (tabName === 'results') {
        simulateLiveResults();
    } else if (tabName === 'news') {
        simulateLiveNews();
    }
};

function simulateLiveResults() {
    const resultsTab = document.getElementById('results-tab');
    if(resultsTab) {
        resultsTab.innerHTML = `
            <div style="padding: 1rem; background: rgba(0,0,0,0.05); border-radius: 8px;">
                <p><strong>Live data currently unavailable</strong></p>
                <p style="margin-top: 0.5rem;">Configure a verified results API source in backend settings to display this panel.</p>
            </div>
        `;
    }
}

function simulateLiveNews() {
    const newsTab = document.getElementById('news-tab');
    if(newsTab) {
        newsTab.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div style="background: rgba(0,0,0,0.05); padding: 1rem; border-radius: 8px;">
                    <p style="margin: 0; font-weight: 600;">Live data currently unavailable</p>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: var(--text-secondary);">Use the News page for verified source retrieval.</p>
                </div>
            </div>
        `;
    }
}
