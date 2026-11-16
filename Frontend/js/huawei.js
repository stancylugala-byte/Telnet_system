document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('huaweiForm');
    const progressSection = document.getElementById('huaweiProgress');
    const progressLog = document.getElementById('huaweiProgressLog');
    const resultArea = document.getElementById('huaweiResult');

    // Initialize activity log
    addLogEntry('huawei', 'Huawei configuration page loaded', true);

    // Toggle between dual and multi SSID
    document.querySelectorAll('input[name="huaweiConfigType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isMulti = e.target.value === 'multi';
            document.getElementById('huaweiDualSSID').style.display = isMulti ? 'none' : 'block';
            document.getElementById('huaweiMultiSSID').style.display = isMulti ? 'block' : 'none';

            if (isMulti) {
                document.getElementById('huaweiSSID24').required = false;
                document.getElementById('huaweiSSID5').required = false;
                addLogEntry('huawei', 'Switched to Multi-SSID mode', true);
            } else {
                document.getElementById('huaweiSSID24').required = true;
                document.getElementById('huaweiSSID5').required = true;
                addLogEntry('huawei', 'Switched to Dual-SSID mode', true);
            }
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Configuring...';

        resultArea.innerHTML = '';
        progressSection.style.display = 'block';
        progressLog.innerHTML = '';

        // Add initial progress entry
        addProgressEntry('Starting Huawei configuration...', 'info');

        // Get form data
        const configType = document.querySelector('input[name="huaweiConfigType"]:checked').value;
        const data = {
            ip: document.getElementById('huaweiIP')?.value.trim() || '192.168.100.1',
            password: document.getElementById('huaweiPassword').value.trim(),
            serial: document.getElementById('huaweiSerial').value.trim(),
            configType: configType
        };

        if (configType === 'dual') {
            data.ssid24 = document.getElementById('huaweiSSID24').value.trim();
            data.ssid5 = document.getElementById('huaweiSSID5').value.trim();
        } else {
            const ssids = document.getElementById('huaweiMultiSSIDs').value
                .split('\n')
                .map(s => s.trim())
                .filter(s => s);
            data.multiSSIDs = ssids;
        }

        // Validate
        if (!data.password) {
            const errorMsg = 'Please enter the Telnet password.';
            addProgressEntry('❌ ' + errorMsg, 'error');
            addLogEntry('huawei', '❌ ' + errorMsg, false);
            showResult('error', errorMsg);
            resetButton();
            return;
        }

        if (configType === 'dual' && (!data.ssid24 || !data.ssid5)) {
            const errorMsg = 'Please enter both 2.4GHz and 5GHz SSID names.';
            addProgressEntry('❌ ' + errorMsg, 'error');
            addLogEntry('huawei', '❌ ' + errorMsg, false);
            showResult('error', errorMsg);
            resetButton();
            return;
        }

        if (configType === 'multi' && data.multiSSIDs.length === 0) {
            const errorMsg = 'Please enter at least one SSID.';
            addProgressEntry('❌ ' + errorMsg, 'error');
            addLogEntry('huawei', '❌ ' + errorMsg, false);
            showResult('error', errorMsg);
            resetButton();
            return;
        }

        // Log the start of configuration
        addLogEntry('huawei', `🔧 Starting Huawei configuration for IP: ${data.ip}`, true);

        // ✅ CREDIT CHECK DISABLED - Testing mode
        addProgressEntry('✅ Payment check disabled - proceeding to configure', 'success');
        addLogEntry('huawei', '🔓 Payment requirement disabled (testing mode)', true);

        try {
            // Step 1: Connecting
            addProgressEntry(`🔄 Connecting to Huawei router at ${data.ip}...`, 'info');
            addLogEntry('huawei', `🌐 Connecting to Huawei router at ${data.ip}...`, true);

            // Step 2: Authenticating
            addProgressEntry('🔐 Authenticating with Telnet password...', 'info');
            addLogEntry('huawei', '🔐 Authenticating with Huawei router...', true);

            // Step 3: Configuring
            addProgressEntry(`📡 Setting 2.4GHz SSID: ${data.ssid24}`, 'info');
            addProgressEntry(`📡 Setting 5GHz SSID: ${data.ssid5}`, 'info');
            addLogEntry('huawei', `📡 Setting 2.4GHz SSID: ${data.ssid24}`, true);
            addLogEntry('huawei', `📡 Setting 5GHz SSID: ${data.ssid5}`, true);

            // Step 4: Send to backend
            addProgressEntry('📤 Sending configuration to server...', 'info');

            const response = await fetch(`${API_URL}/config/huawei`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Success
                addProgressEntry('✅ Configuration complete!', 'success');
                addLogEntry('huawei', `✅ Huawei router configured successfully! IP: ${data.ip}`, true);
                if (configType === 'dual') {
                    addLogEntry('huawei', `📡 2.4GHz: ${data.ssid24}, 5GHz: ${data.ssid5}`, true);
                }

                showResult('success', `
                    <strong>✅ Huawei Router Configured Successfully!</strong><br>
                    ${result.message || 'All settings have been applied.'}
                `);
            } else {
                const errorMsg = result.error || 'Configuration failed. Please try again.';
                addProgressEntry('❌ ' + errorMsg, 'error');
                addLogEntry('huawei', `❌ Huawei configuration failed: ${errorMsg}`, false);
                showResult('error', errorMsg);
            }
        } catch (error) {
            const errorMsg = 'Network error. Please check your connection and try again.';
            addProgressEntry('❌ ' + errorMsg, 'error');
            addLogEntry('huawei', `❌ Huawei configuration error: ${error.message}`, false);
            showResult('error', errorMsg);
        } finally {
            resetButton();
        }
    });

    // Helper function to add progress entries
    function addProgressEntry(message, type = 'info') {
        const progressLog = document.getElementById('huaweiProgressLog');
        if (!progressLog) return;

        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('p');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="time">[${timestamp}]</span> ${message}`;
        progressLog.appendChild(entry);

        // Auto-scroll to bottom
        progressLog.scrollTop = progressLog.scrollHeight;
    }

    function showResult(type, message) {
        const resultArea = document.getElementById('huaweiResult');
        resultArea.innerHTML = `<div class="${type}">${message}</div>`;
    }

    function resetButton() {
        const btn = document.querySelector('#huaweiForm button[type="submit"]');
        btn.disabled = false;
        btn.textContent = 'Configure Huawei Router';
    }
});

