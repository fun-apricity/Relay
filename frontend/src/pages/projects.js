import { GET, POST, PATCH, DELETE } from '../api.js';
import { getState, navigate } from '../store.js';
import { statusBadge, fmtDate, avatarHtml, loading, setContent, closeModal, isOverdue, priorityEl } from '../components/shared.js';
import { showModal } from '../components/modal.js';

export async function renderProjects() {
  loading();
  try {
    const { projects } = await GET('/projects');
    const user = getState().user;
    const canCreate = user?.role === 'admin';

    const cards = projects.length
      ? projects.map(p => {
          const total = parseInt(p.task_count) || 0;
          const done = parseInt(p.completed_tasks) || 0;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return `
            <div class="project-card" onclick="window.__openProject(${p.id})">
              <div class="project-card-header">
                ${statusBadge(p.status)}
                <span class="text-xs text-muted">${fmtDate(p.deadline)}</span>
              </div>
              <div class="project-name">${escapeHtml(p.name)}</div>
              <div class="project-desc">${escapeHtml(p.description) || 'No description'}</div>
              <div class="project-meta">
                <span>${p.owner_name || '—'}</span>
                <span>${p.member_count} member${p.member_count !== 1 ? 's' : ''}</span>
                <span>${total} task${total !== 1 ? 's' : ''}</span>
              </div>
              <div class="project-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${pct}%"></div>
                </div>
                <div class="progress-label">${done}/${total} · ${pct}%</div>
              </div>
            </div>
          `;
        }).join('')
      : `<div class="empty-state" style="grid-column:1/-1">
          <div class="empty-title">No projects yet</div>
          <div class="empty-desc">${canCreate ? 'Create your first project to get started.' : 'You haven\'t been added to any projects yet.'}</div>
        </div>`;

    setContent(`
      <div class="page-header">
        <div>
          <div class="page-title">Projects</div>
          <div class="page-subtitle">${projects.length} project${projects.length !== 1 ? 's' : ''} total</div>
        </div>
        ${canCreate ? `<button class="btn btn-primary" onclick="window.__createProject()">+ New Project</button>` : ''}
      </div>
      <div class="project-grid">${cards}</div>
    `);

    window.__openProject = (id) => navigate('project_detail', { id });
    window.__createProject = () => openCreateProject();
  } catch (e) {
    setContent(`<div class="alert alert-error">${e.message}</div>`);
  }
}

async function openCreateProject() {
  const result = await showModal(`
    <div class="modal-overlay" onclick="if(event.target===this)window.__closeModal(null)">
      <div class="modal">
        <button class="modal-close" onclick="window.__closeModal(null)">✕</button>
        <div class="modal-title">New Project</div>
        <div id="pj-modal-alert"></div>
        <div class="form-group">
          <label class="form-label">Name *</label>
          <input type="text" id="pj-name" class="form-input" placeholder="e.g. Website Redesign" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="pj-desc" class="form-input" placeholder="What's this project about?" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Deadline</label>
          <input type="date" id="pj-deadline" class="form-input" />
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="window.__closeModal(null)">Cancel</button>
          <button class="btn btn-primary" onclick="window.__submitProject()">Create</button>
        </div>
      </div>
    </div>
  `);
}

window.__submitProject = async () => {
  const name = document.getElementById('pj-name')?.value.trim();
  const description = document.getElementById('pj-desc')?.value.trim();
  const deadline = document.getElementById('pj-deadline')?.value;
  if (!name) {
    const el = document.getElementById('pj-modal-alert');
    if (el) el.innerHTML = '<div class="alert alert-error">Project name is required.</div>';
    return;
  }
  try {
    await POST('/projects', { name, description: description || null, deadline: deadline || null });
    closeModal();
    renderProjects();
  } catch (e) {
    const el = document.getElementById('pj-modal-alert');
    if (el) el.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
};

// ─── PROJECT DETAIL ───

export async function renderProjectDetail({ id }) {
  loading();
  try {
    const [{ project, members }, { tasks }] = await Promise.all([
      GET(`/projects/${id}`),
      GET(`/tasks?project_id=${id}`)
    ]);

    const user = getState().user;
    const isAdmin = user?.role === 'admin';

    const taskRows = tasks.length
      ? tasks.map(t => `
          <div class="task-row" onclick="window.__openTaskDetail(${t.id})">
            <div class="task-check ${t.status === 'done' ? 'done' : ''}"></div>
            <div class="task-title-cell ${t.status === 'done' ? 'done' : ''}">
              ${escapeHtml(t.title)}
            </div>
            <div class="flex items-center gap-2" style="margin-right:4px">
              ${t.assignee_name ? avatarHtml(t.assignee_name, t.assignee_color, 'avatar-sm') : ''}
              <span class="text-sm text-muted">${t.assignee_name || '—'}</span>
            </div>
            ${priorityEl(t.priority)}
            ${statusBadge(t.status)}
            <span class="text-sm ${isOverdue(t.due_date, t.status) ? 'overdue-text' : 'text-muted'}" style="min-width:70px;text-align:right">
              ${fmtDate(t.due_date)}
            </span>
          </div>
        `).join('')
      : `<div class="empty-state"><div class="empty-title">No tasks yet</div><div class="empty-desc">Add the first task to this project.</div></div>`;

    const memberHtml = members.length
      ? members.map(m => `
          <div class="member-item">
            ${avatarHtml(m.name, m.avatar_color)}
            <div class="member-item-info">
              <div class="member-item-name">${escapeHtml(m.name)}</div>
              <div class="member-item-email">${m.email}</div>
            </div>
            <span class="badge ${m.role === 'admin' ? 'badge-admin' : 'badge-todo'}">${m.role}</span>
            ${isAdmin && m.id !== user?.id
              ? `<button class="btn btn-danger btn-sm" onclick="window.__removeMember(${id}, ${m.id})">Remove</button>`
              : ''}
          </div>
        `).join('')
      : '<div class="text-sm text-muted" style="padding:8px 0">No members yet.</div>';

    const statusOpts = ['active', 'completed', 'on_hold'].map(s =>
      `<option value="${s}" ${project.status === s ? 'selected' : ''}>${s.replace('_', ' ')}</option>`
    ).join('');

    setContent(`
      <div class="page-header">
        <div>
          <button class="btn btn-ghost btn-sm" style="margin-bottom:8px" onclick="window.__goBack()">← Back</button>
          <div class="page-title">${escapeHtml(project.name)}</div>
          <div class="page-subtitle">${escapeHtml(project.description) || 'No description'} · ${statusBadge(project.status)}</div>
        </div>
        <div class="flex gap-2" style="flex-shrink:0">
          ${isAdmin ? `<button class="btn btn-secondary btn-sm" onclick="window.__addMemberToProject(${id})">+ Member</button>` : ''}
          <button class="btn btn-primary btn-sm" onclick="window.__createTaskInProject(${id})">+ Task</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 260px;gap:20px">
        <div class="card">
          <div class="card-title">Tasks <span class="text-muted">(${tasks.length})</span></div>
          <div class="task-list">${taskRows}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="card">
            <div class="card-title">Members</div>
            ${memberHtml}
          </div>
          ${isAdmin ? `
          <div class="card">
            <div class="card-title">Settings</div>
            <div class="form-group" style="margin-bottom:12px">
              <label class="form-label">Status</label>
              <select class="form-select" id="pj-status" onchange="window.__updateProjectStatus(${id}, this.value)">
                ${statusOpts}
              </select>
            </div>
            <button class="btn btn-danger btn-sm w-full" style="justify-content:center" onclick="window.__deleteProject(${id})">
              Delete Project
            </button>
          </div>` : ''}
        </div>
      </div>
    `);

    window.__goBack = () => navigate('projects');
  } catch (e) {
    setContent(`<div class="alert alert-error">${e.message}</div>`);
  }
}

window.__openTaskDetail = (taskId) => {
  window.dispatchEvent(new CustomEvent('open-task-detail', { detail: { taskId } }));
};

window.__updateProjectStatus = async (id, status) => {
  try {
    await PATCH(`/projects/${id}`, { status });
  } catch (e) { /* ignore */ }
};

window.__deleteProject = async (id) => {
  if (!confirm('Delete this project and all its tasks?')) return;
  try {
    await DELETE(`/projects/${id}`);
    navigate('projects');
  } catch (e) { /* ignore */ }
};

window.__addMemberToProject = async (projectId) => {
  showModal(`
    <div class="modal-overlay" onclick="if(event.target===this)window.__closeModal(null)">
      <div class="modal">
        <button class="modal-close" onclick="window.__closeModal(null)">✕</button>
        <div class="modal-title">Add Member</div>
        <div class="form-group">
          <label class="form-label">Search by name or email</label>
          <input type="text" id="member-search-input" class="form-input"
            placeholder="Start typing..." oninput="window.__searchUsers(this.value, ${projectId})" autofocus />
        </div>
        <div id="member-search-results"></div>
      </div>
    </div>
  `);
  setTimeout(() => document.getElementById('member-search-input')?.focus(), 100);
};

window.__searchUsers = async (q, projectId) => {
  if (q.length < 2) return;
  try {
    const { users } = await GET(`/users/search?q=${encodeURIComponent(q)}`);
    const container = document.getElementById('member-search-results');
    if (!container) return;
    container.innerHTML = users.length
      ? users.map(u => `
          <div class="user-search-item" onclick="window.__addMember(${projectId}, ${u.id})">
            ${avatarHtml(u.name, u.avatar_color)}
            <div>
              <div style="font-size:0.8rem;font-weight:500">${escapeHtml(u.name)}</div>
              <div style="font-size:0.65rem;color:var(--text-muted)">${u.email}</div>
            </div>
          </div>
        `).join('')
      : '<div class="text-sm text-muted" style="padding:12px">No users found</div>';
  } catch (_) {}
};

window.__addMember = async (projectId, userId) => {
  try {
    await POST(`/projects/${projectId}/members`, { user_id: userId });
    closeModal();
    navigate('project_detail', { id: projectId });
  } catch (e) { alert(e.message); }
};

window.__removeMember = async (projectId, userId) => {
  if (!confirm('Remove this member from the project?')) return;
  try {
    await DELETE(`/projects/${projectId}/members/${userId}`);
    navigate('project_detail', { id: projectId });
  } catch (e) { alert(e.message); }
};

window.__createTaskInProject = (projectId) => {
  window.dispatchEvent(new CustomEvent('create-task', { detail: { projectId } }));
};

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
