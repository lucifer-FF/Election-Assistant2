export function setupReminders() {
    window.setReminder = function() {
        const email = document.getElementById('reminder-email').value.trim();
        const hasReminders = document.getElementById('registration-reminder').checked ||
                           document.getElementById('campaign-reminder').checked ||
                           document.getElementById('voting-reminder').checked ||
                           document.getElementById('results-reminder').checked;

        const resultDiv = document.getElementById('reminder-result');
        resultDiv.style.display = 'block';

        if (!email || !email.includes('@')) {
            resultDiv.style.backgroundColor = '#FEF2F2';
            resultDiv.style.color = '#B91C1C';
            resultDiv.innerHTML = '<p>Please enter a valid email address.</p>';
            return;
        }

        if (!hasReminders) {
            resultDiv.style.backgroundColor = '#FEF2F2';
            resultDiv.style.color = '#B91C1C';
            resultDiv.innerHTML = '<p>Please select at least one reminder type.</p>';
            return;
        }

        const reminders = {
            email: email,
            registration: document.getElementById('registration-reminder').checked,
            campaign: document.getElementById('campaign-reminder').checked,
            voting: document.getElementById('voting-reminder').checked,
            results: document.getElementById('results-reminder').checked,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('electionReminders', JSON.stringify(reminders));

        resultDiv.style.backgroundColor = '#F0FDF4';
        resultDiv.style.color = '#15803D';
        resultDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <span style="font-size: 1.25rem;">🔔</span>
                <strong>Reminders Enabled!</strong>
            </div>
            <p style="margin: 0.5rem 0;">You'll receive email reminders at ${email}</p>
            <p style="margin: 0; font-size: 0.9rem;">Check your email to confirm subscription.</p>
        `;
    };

    function loadSavedReminders() {
        const saved = localStorage.getItem('electionReminders');
        if (saved) {
            const reminders = JSON.parse(saved);
            const regRem = document.getElementById('registration-reminder');
            if (regRem) {
                regRem.checked = reminders.registration;
                document.getElementById('campaign-reminder').checked = reminders.campaign;
                document.getElementById('voting-reminder').checked = reminders.voting;
                document.getElementById('results-reminder').checked = reminders.results;
                document.getElementById('reminder-email').value = reminders.email;
            }
        }
    }

    loadSavedReminders();
}
