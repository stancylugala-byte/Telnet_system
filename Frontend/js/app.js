// frontend/js/app.js

// ===== GLOBAL STATE =====
let currentUser = null;
let authToken = null;
const API_URL = 'http://localhost:5000/api';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('telnetpilot_token');
    if (token) {
        authToken = token;
        verifyToken();
    }

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
        });
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
});

// ===== AUTH =====
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = '';

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('telnetpilot_token', authToken);
            showApp();
        } else {
            errorEl.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        errorEl.textContent = 'Network error. Please try again.';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const errorEl = document.getElementById('registerError');
    errorEl.textContent = '';

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registration successful! Please login.');
            showLogin();
        } else {
            errorEl.textContent = data.error || 'Registration failed';
        }
    } catch (error) {
        errorEl.textContent = 'Network error. Please try again.';
    }
}

async function verifyToken() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            showApp();
        } else {
            localStorage.removeItem('telnetpilot_token');
            showLogin();
        }
    } catch (error) {
        localStorage.removeItem('telnetpilot_token');
        showLogin();
    }
}

function logout() {
    localStorage.removeItem('telnetpilot_token');
    authToken = null;
    currentUser = null;
    showLogin();
}

// ===== NAVIGATION =====
function showLogin() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('appScreen').classList.remove('active');
}

function showRegister() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('registerScreen').classList.add('active');
}

function showLoginFromRegister() {
    document.getElementById('registerScreen').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
}

function showApp() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('appScreen').classList.add('active');
    navigateTo('dashboard');
}

function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) targetPage.classList.add('active');
}

// ===== ACTIVITY LOG FUNCTIONS =====
function addLogEntry(router, message, isSuccess = true) {
    const logContainer = document.getElementById(`${router}ActivityLog`);
    if (!logContainer) {
        console.warn(`Log container for ${router} not found`);
        return;
    }

    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <span class="time">[${timestamp}]</span>
        <span class="log-message">${message}</span>
        <span style="color: ${isSuccess ? '#22c55e' : '#ef4444'}; margin-left: 8px;">
            ${isSuccess ? '✅' : '❌'}
        </span>
    `;

    const emptyMsg = logContainer.querySelector('.log-empty');
    if (emptyMsg) emptyMsg.remove();

    logContainer.prepend(entry);

    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.lastChild);
    }
}

function clearLog(router) {
    const logContainer = document.getElementById(`${router}ActivityLog`);
    if (!logContainer) return;
    logContainer.innerHTML = `<p class="log-empty">No activity yet</p>`;
}


