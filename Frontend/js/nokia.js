document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('nokiaForm');
    const progressArea = document.getElementById('nokiaProgress');
    const progressBar = document.getElementById('nokiaProgressBar');
    const progressText = document.getElementById('nokiaProgressText');
    const resultArea = document.getElementById('nokiaResult');

    // Initialize activity log
    addLogEntry('nokia', 'Nokia configuration page loaded', true);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Configuring...';

        resultArea.innerHTML = '';
        progressArea.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = 'Connecting to router...';

        // Get form data
        const data = {
            ip: document.getElementById('nokiaIP').value.trim(),
            username: document.getElementById('nokiaUsername').value.trim(),
            password: document.getElementById('nokiaPassword').value.trim(),
            ssid24: document.getElementById('nokiaSSID24').value.trim(),
            ssid5: document.getElementById('nokiaSSID5').value.trim()
        };

        // Validate
        if (!data.ip || !data.username || !data.password || !data.ssid24 || !data.ssid5) {
            showResult('error', 'Please fill in all required fields.');
            addLogEntry('nokia', '❌ Configuration failed: Missing required fields', false);
            resetButton();
            return;
        }

        // Log the start of configuration
        addLogEntry('nokia', `🔧 Starting Nokia configuration for IP: ${data.ip}`, true);

        try {
            // Progress simulation
            progressBar.style.width = '25%';
            progressText.textContent = 'Connecting to Nokia router...';
            addLogEntry('nokia', `🌐 Connecting to Nokia router at ${data.ip}...`, true);

            setTimeout(() => {
                progressBar.style.width = '50%';
                progressText.textContent = 'Authenticating...';
                addLogEntry('nokia', `🔐 Authenticating with username: ${data.username}`, true);
            }, 1000);

            setTimeout(() => {
                progressBar.style.width = '75%';
                progressText.textContent = 'Applying Wi-Fi configuration...';
                addLogEntry('nokia', `📡 Setting 2.4GHz SSID: ${data.ssid24}`, true);
                addLogEntry('nokia', `📡 Setting 5GHz SSID: ${data.ssid5}`, true);
            }, 2000);

            // Send to backend
            const response = await fetch(`${API_URL}/config/nokia`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                progressBar.style.width = '100%';
                progressText.textContent = '✅ Configuration complete!';

                // Log success
                addLogEntry('nokia', `✅ Nokia router configured successfully! IP: ${data.ip}`, true);
                addLogEntry('nokia', `📡 2.4GHz: ${data.ssid24}, 5GHz: ${data.ssid5}`, true);
                addLogEntry('nokia', `💰 Credits remaining: ${result.creditsRemaining || 'N/A'}`, true);

                showResult('success', `
                    <strong>✅ Nokia Router Configured Successfully!</strong><br>
                    ${result.message || 'All settings have been applied.'}
                    <br><br>
                    <small>Credits remaining: ${result.creditsRemaining || 'N/A'}</small>
                `);
                updateCredits();
                loadActivityLog();
            } else {
                const errorMsg = result.error || 'Configuration failed. Please try again.';
                addLogEntry('nokia', `❌ Nokia configuration failed: ${errorMsg}`, false);
                showResult('error', errorMsg);
            }
        } catch (error) {
            const errorMsg = 'Network error. Please check your connection and try again.';
            addLogEntry('nokia', `❌ Nokia configuration error: ${error.message}`, false);
            showResult('error', errorMsg);
        } finally {
            resetButton();
            setTimeout(() => {
                progressArea.style.display = 'none';
            }, 5000);
        }
    });

    function showResult(type, message) {
        const resultArea = document.getElementById('nokiaResult');
        resultArea.innerHTML = `<div class="${type}">${message}</div>`;
    }

    function resetButton() {
        const btn = document.querySelector('#nokiaForm button[type="submit"]');
        btn.disabled = false;
        btn.textContent = 'Configure Nokia Router';
    }
});


