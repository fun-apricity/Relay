import './style.css';
import { getState, setState, subscribe, navigate } from './store.js';
import { checkAuth } from './pages/auth.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderProjects, renderProjectDetail } from './pages/projects.js';
import { renderTasks, setupTaskListeners } from './pages/tasks.js';
import { renderTeam } from './pages/team.js';
import { avatarHtml, closeModal } from './components/shared.js';
import { closeModal as modalClose } from './components/modal.js';

// ─── INIT ───

const pageRouters = {
  dashboard: renderDashboard,
  projects: renderProjects,
  tasks: renderTasks,
  team: renderTeam,
  project_detail: renderProjectDetail
};

// ─── SIDEBAR SETUP ───

function setupSidebar() {
  const navMap = {
    dashboard: { icon: '◈', label: 'Dashboard' },
    projects: { icon: '⊞', label: 'Projects' },
    tasks: { icon: '☑', label: 'Tasks' },
    team: { icon: '◆', label: 'Team' }
  };

  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      navigate(page);
    });
  });
}

function updateSidebar() {
  const user = getState().user;
  if (!user) return;

  // Update user info
  const avatar = document.getElementById('sidebar-avatar');
  const nameEl = document.getElementById('sidebar-name');
  const roleEl = document.getElementById('sidebar-role');
  const adminNav = document.getElementById('admin-nav');

  if (avatar) {
    avatar.textContent = user.name[0].toUpperCase();
    avatar.style.background = user.avatar_color || '#6366f1';
  }
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role;

  if (adminNav) {
    adminNav.classList.toggle('hidden', user.role !== 'admin');
  }

  // Store current user id globally for team page
  window.__currentUserId = user.id;

  // Update active nav
  const page = getState().page;
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
}

function renderAppShell() {
  const app = document.getElementById('app-screen');
  const isAdmin = getState().user?.role === 'admin';

  app.innerHTML = `
    <aside class="sidebar">
      <div class="sidebar-logo">_task<span>flow</span></div>

      <div class="sidebar-section">
        <div class="sidebar-section-label nav-text">Menu</div>
        <button class="nav-item active" data-page="dashboard">
          <span class="nav-icon">◈</span><span class="nav-text">Dashboard</span>
        </button>
        <button class="nav-item" data-page="projects">
          <span class="nav-icon">⊞</span><span class="nav-text">Projects</span>
        </button>
        <button class="nav-item" data-page="tasks">
          <span class="nav-icon">☑</span><span class="nav-text">Tasks</span>
        </button>
        <div id="admin-nav" class="${isAdmin ? '' : 'hidden'}">
          <div class="sidebar-section-label nav-text">Admin</div>
          <button class="nav-item" data-page="team">
            <span class="nav-icon">◆</span><span class="nav-text">Team</span>
          </button>
        </div>
      </div>

      <div class="sidebar-bottom">
        <div class="user-profile" id="user-profile">
          <div class="avatar" id="sidebar-avatar"></div>
          <div class="user-info">
            <div class="user-name" id="sidebar-name"></div>
            <div class="user-role" id="sidebar-role"></div>
          </div>
        </div>
        <button class="nav-item mt-1" onclick="window.handleLogout()" style="color:var(--danger)">
          <span class="nav-icon">⏻</span><span class="nav-text">Sign Out</span>
        </button>
      </div>
    </aside>
    <main class="main" id="main-content">
      <div class="loading-center"><div class="spinner"></div></div>
    </main>
  `;

  setupSidebar();
  updateSidebar();
  setupTaskListeners();
}

// ─── STATE SUBSCRIPTIONS ───

subscribe('user', (state) => {
  if (state.user && !document.querySelector('.sidebar')) {
    renderAppShell();
  }
  if (!state.user) {
    const app = document.getElementById('app-screen');
    if (app) app.classList.add('hidden');
  }
});

subscribe('page', () => {
  const user = getState().user;
  if (!user) return;
  updateSidebar();

  const page = getState().page;
  const params = getState().pageParams || {};
  const router = pageRouters[page];
  if (router) {
    closeModal();
    modalClose();
    router(params);
  }
});

// ─── BOOT ───

checkAuth();
