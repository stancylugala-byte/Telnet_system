document.addEventListener('DOMContentLoaded', () => {
    // Coupon redemption
    document.getElementById('couponForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('couponCode').value.trim().toUpperCase();
        const resultArea = document.getElementById('couponResult');

        resultArea.innerHTML = '<p>Processing...</p>';

        try {
            const response = await fetch(`${API_URL}/credits/redeem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ code })
            });

            const data = await response.json();

            if (response.ok) {
                resultArea.innerHTML = `<div class="success">✅ ${data.message}<br>New balance: ${data.credits.toFixed(2)} credits</div>`;
                document.getElementById('couponCode').value = '';
                updateCredits();
            } else {
                resultArea.innerHTML = `<div class="error">❌ ${data.error || 'Invalid coupon code'}</div>`;
            }
        } catch (error) {
            resultArea.innerHTML = `<div class="error">❌ Network error. Please try again.</div>`;
        }
    });

    // M-Pesa Payment
    document.getElementById('paymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = document.getElementById('paymentAmount').value.trim();
        const phone = document.getElementById('paymentPhone').value.trim();
        const resultArea = document.getElementById('paymentResult');
        const statusArea = document.getElementById('paymentStatus');
        const submitBtn = document.querySelector('#paymentForm button[type="submit"]');

        resultArea.innerHTML = '';
        statusArea.innerHTML = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        // Validate phone number
        if (!phone.match(/^254[0-9]{9}$/)) {
            resultArea.innerHTML = `<div class="error">❌ Please enter a valid phone number (format: 254712345678)</div>`;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Initiate M-Pesa Payment';
            return;
        }

        if (!amount || amount < 1) {
            resultArea.innerHTML = `<div class="error">❌ Please enter a valid amount (minimum 1 KES)</div>`;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Initiate M-Pesa Payment';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/payment/mpesa`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ amount: parseFloat(amount), phone })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                resultArea.innerHTML = `
                    <div class="success">
                        ✅ ${data.message}<br>
                        <small>Checkout ID: ${data.checkoutRequestId}</small>
                        <br><br>
                        <strong>Please check your phone and enter your M-Pesa PIN to complete the payment.</strong>
                    </div>
                `;

                // Poll for payment status
                let attempts = 0;
                const maxAttempts = 30;
                const checkStatus = setInterval(async () => {
                    attempts++;
                    try {
                        const statusRes = await fetch(`${API_URL}/payment/status/${data.paymentId}`, {
                            headers: { 'Authorization': `Bearer ${authToken}` }
                        });

                        if (statusRes.ok) {
                            const statusData = await statusRes.json();
                            statusArea.innerHTML = `<p>Status: <strong>${statusData.status.toUpperCase()}</strong></p>`;

                            if (statusData.status === 'completed') {
                                clearInterval(checkStatus);
                                statusArea.innerHTML += `<p style="color:#22c55e;">✅ Payment completed! Credits added to your account.</p>`;
                                updateCredits();
                                document.getElementById('paymentAmount').value = '';
                                document.getElementById('paymentPhone').value = '';
                            } else if (statusData.status === 'failed') {
                                clearInterval(checkStatus);
                                statusArea.innerHTML += `<p style="color:#ef4444;">❌ Payment failed. Please try again.</p>`;
                            }
                        }
                    } catch (error) {
                        console.error('Status check error:', error);
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(checkStatus);
                        statusArea.innerHTML += `<p style="color:#f59e0b;">⏰ Payment still pending. Please check your phone or try again later.</p>`;
                    }
                }, 3000);

            } else {
                resultArea.innerHTML = `<div class="error">❌ ${data.error || 'Payment initiation failed'}</div>`;
            }
        } catch (error) {
            resultArea.innerHTML = `<div class="error">❌ Network error. Please try again.</div>`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Initiate M-Pesa Payment';
        }
    });
});


