import { POST, GET } from '../api.js';
import { setState, navigate } from '../store.js';

let currentTab = 'login';

export function renderAuth() {
  const screen = document.getElementById('auth-screen');
  screen.classList.remove('hidden');
  screen.innerHTML = `
    <div class="auth-container">
      <div class="auth-header">
        <div class="auth-logo">_task<span>flow</span></div>
        <div class="auth-subtitle">
          A minimal, monospace task manager for<br />teams that build things.
        </div>
      </div>
      <div class="auth-card">
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login">Sign In</button>
          <button class="auth-tab" data-tab="register">Create Account</button>
        </div>
        <div id="auth-alert"></div>
        <div id="auth-form-container">
          ${renderLoginForm()}
        </div>
      </div>
      <div style="text-align:center;margin-top:16px">
        <span style="font-size:0.65rem;color:var(--text-dim)">TaskFlow · v1.0</span>
      </div>
    </div>
  `;

  document.querySelectorAll('.auth-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  document.getElementById('login-email')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('login-password')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('reg-name')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  });
  document.getElementById('reg-email')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  });
  document.getElementById('reg-password')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  });
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.auth-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.getElementById('auth-alert').innerHTML = '';
  document.getElementById('auth-form-container').innerHTML =
    tab === 'login' ? renderLoginForm() : renderRegisterForm();

  // Re-attach keyboard event listeners after DOM update
  document.getElementById('login-email')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('login-password')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('reg-name')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  });
  document.getElementById('reg-email')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  });
  document.getElementById('reg-password')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  });
}

function renderLoginForm() {
  return `
    <div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" id="login-email" class="form-input" placeholder="you@company.com" autocomplete="email" />
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="login-password" class="form-input" placeholder="••••••••" autocomplete="current-password" />
      </div>
      <button class="btn btn-primary w-full" id="login-btn" style="justify-content:center;margin-top:4px" onclick="window.handleLogin()">
        Sign In
      </button>
    </div>
  `;
}

function renderRegisterForm() {
  return `
    <div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input type="text" id="reg-name" class="form-input" placeholder="Alex" autocomplete="name" />
        </div>
        <div class="form-group">
          <label class="form-label">Account type</label>
          <select id="reg-role" class="form-select">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" id="reg-email" class="form-input" placeholder="you@company.com" autocomplete="email" />
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="reg-password" class="form-input" placeholder="Min 6 characters" autocomplete="new-password" />
      </div>
      <button class="btn btn-primary w-full" id="register-btn" style="justify-content:center;margin-top:4px" onclick="window.handleRegister()">
        Create Account
      </button>
    </div>
  `;
}

function showAlert(msg, type = 'error') {
  const el = document.getElementById('auth-alert');
  if (el) el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

async function handleLogin() {
  const email = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  if (!email || !password) return showAlert('All fields are required.');

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    const data = await POST('/auth/login', { email, password });
    localStorage.setItem('tf_token', data.token);
    setState({ user: data.user });
    enterApp();
  } catch (e) {
    showAlert(e.message);
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

async function handleRegister() {
  const name = document.getElementById('reg-name')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const role = document.getElementById('reg-role')?.value;

  if (!name || !email || !password) return showAlert('All fields are required.');

  const btn = document.getElementById('register-btn');
  btn.disabled = true;
  btn.textContent = 'Creating...';

  try {
    const data = await POST('/auth/register', { name, email, password, role });
    localStorage.setItem('tf_token', data.token);
    setState({ user: data.user });
    enterApp();
  } catch (e) {
    showAlert(e.message);
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

function enterApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  navigate('dashboard');
}

export async function checkAuth() {
  const token = localStorage.getItem('tf_token');
  if (!token) { renderAuth(); return; }
  try {
    const data = await GET('/auth/me');
    setState({ user: data.user });
    enterApp();
  } catch (_) {
    localStorage.removeItem('tf_token');
    renderAuth();
  }
}

export function handleLogout() {
  localStorage.removeItem('tf_token');
  setState({ user: null });
  document.getElementById('app-screen').classList.add('hidden');
  renderAuth();
}

// Make handlers globally accessible for inline onclick
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
