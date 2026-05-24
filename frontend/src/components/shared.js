export function setContent(html) {
  const el = document.getElementById('main-content');
  if (el) el.innerHTML = html;
}

export function loading() {
  setContent(`
    <div class="loading-center">
      <div class="spinner"></div>
    </div>
  `);
}

export function statusBadge(s) {
  const labels = {
    todo: 'todo',
    in_progress: 'in prog',
    review: 'review',
    done: 'done',
    active: 'active',
    completed: 'done',
    on_hold: 'hold'
  };
  return `<span class="badge badge-${s}">${labels[s] || s.replace('_', ' ')}</span>`;
}

export function priorityEl(p) {
  return `<span class="priority-label priority-${p}">
    <span class="priority-dot dot-${p}"></span>${p}
  </span>`;
}

export function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export function isOverdue(d, status) {
  return d && status !== 'done' && new Date(d) < new Date(new Date().toDateString());
}

export function avatarHtml(name, color, size = '') {
  const initial = name?.[0]?.toUpperCase() || '?';
  return `<div class="avatar ${size}" style="background:${color || '#6366f1'}">${initial}</div>`;
}

export function closeModal() {
  document.getElementById('modal-container').innerHTML = '';
}

export function scrollToTop() {
  const main = document.getElementById('main-content');
  if (main) main.scrollTop = 0;
}

// ─── GLOBAL HELPERS ───

// For opening task detail from onclick handlers
import { navigate } from '../store.js';

window.__openTaskDetail = (taskId) => {
  // Dispatch custom event that tasks page listens to
  window.dispatchEvent(new CustomEvent('open-task-detail', { detail: { taskId } }));
};
