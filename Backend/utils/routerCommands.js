// backend/utils/routerCommands.js
const net = require('net');

// ============================================
// HUAWEI ROUTER CONFIGURATION (Raw TCP Socket)
// ============================================
const configureHuawei = (config) => {
    return new Promise((resolve) => {
        console.log('');
        console.log('═══════════════════════════════════════════');
        console.log('🔧 Huawei Configuration Started');
        console.log('   Target IP:', config.ip);
        console.log('   2.4GHz SSID:', config.ssid24);
        console.log('   5GHz SSID:', config.ssid5);
        console.log('═══════════════════════════════════════════');

        const client = new net.Socket();
        let responseBuffer = '';
        let step = 0;
        let resolved = false;

        const finish = (result) => {
            if (resolved) return;
            resolved = true;
            try { client.destroy(); } catch (e) {}
            resolve(result);
        };

        const overallTimeout = setTimeout(() => {
            console.log('❌ OVERALL TIMEOUT');
            finish({ success: false, error: 'Connection timeout' });
        }, 90000);

        client.setTimeout(80000);

        client.connect(23, config.ip, () => {
            console.log('✅ TCP connection established');
        });

        client.on('data', (data) => {
            const text = data.toString();
            responseBuffer += text;
            console.log('📥 ROUTER:', JSON.stringify(text).substring(0, 150));
            console.log('   [step:', step + ']');

            // Step 0: Wait for Login:
            if (step === 0 && /login\s*:/i.test(text)) {
                console.log('📤 → Sending username: root');
                client.write('root\r\n');
                step = 1;
                return;
            }

            // Step 1: Wait for Password:
            if (step === 1 && /password\s*:/i.test(text)) {
                console.log('📤 → Sending password');
                client.write(`${config.password}\r\n`);
                step = 2;
                return;
            }

            // Step 2: Wait for WAP> prompt, then enter SU mode
            if (step === 2 && /WAP\s*>/i.test(text)) {
                console.log('✅ Logged in as root');
                console.log('📤 → Entering SU mode');
                client.write('su\r\n');
                step = 3;
                return;
            }

            // Step 3: Wait for SU_WAP> prompt, then change 2.4GHz SSID
            if (step === 3 && /SU_WAP\s*>/i.test(text)) {
                console.log('✅ SU mode active');
                console.log('📤 → Setting 2.4GHz SSID:', config.ssid24);
                client.write(`set wlan basic laninst 1 wlaninst 1 ssid ${config.ssid24}\r\n`);
                step = 4;
                return;
            }

            // Step 4: Wait for success, then change 5GHz SSID
            if (step === 4 && /success!/i.test(text)) {
                console.log('✅ 2.4GHz SSID set');
                console.log('📤 → Setting 5GHz SSID:', config.ssid5);
                client.write(`set wlan basic laninst 1 wlaninst 5 ssid ${config.ssid5}\r\n`);
                step = 5;
                return;
            }

            // Step 5: Wait for success, then save
            if (step === 5 && /success!/i.test(text)) {
                console.log('✅ 5GHz SSID set');
                console.log('📤 → Saving configuration');
                client.write('save data\r\n');
                step = 6;
                return;
            }

            // Step 6: Wait for success, then logout
            if (step === 6 && /success!/i.test(text)) {
                console.log('✅ Configuration saved');
                console.log('📤 → Logging out');
                client.write('logout\r\n');
                step = 7;

                // Wait for logout response then finish
                setTimeout(() => {
                    clearTimeout(overallTimeout);
                    console.log('');
                    console.log('═══════════════════════════════════════════');
                    console.log('🎉 CONFIGURATION COMPLETE!');
                    console.log('   ✅ 2.4GHz SSID:', config.ssid24);
                    console.log('   ✅ 5GHz SSID:', config.ssid5);
                    console.log('   ✅ Changes saved');
                    console.log('═══════════════════════════════════════════');
                    finish({
                        success: true,
                        message: 'Huawei router configured successfully!',
                        response: responseBuffer
                    });
                }, 3000);
                return;
            }

            // Detect login failure
            if (/user name or password is wrong/i.test(text)) {
                console.log('❌ LOGIN FAILED - wrong password');
                clearTimeout(overallTimeout);
                finish({
                    success: false,
                    error: 'Login failed - wrong username or password'
                });
                return;
            }
        });

        client.on('error', (err) => {
            console.log('❌ Socket error:', err.message);
            clearTimeout(overallTimeout);
            finish({ success: false, error: `Network error: ${err.message}` });
        });

        client.on('timeout', () => {
            console.log('❌ Socket timeout');
            clearTimeout(overallTimeout);
            finish({ success: false, error: 'Socket timeout' });
        });

        client.on('close', () => {
            console.log('🔌 Connection closed');
        });
    });
};

// ============================================
// NOKIA ROUTER CONFIGURATION (Placeholder)
// ============================================
const configureNokia = (config) => {
    return new Promise((resolve) => {
        resolve({
            success: false,
            error: 'Nokia configuration not yet implemented'
        });
    });
};

module.exports = { configureHuawei, configureNokia };

