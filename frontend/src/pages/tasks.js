import { GET, POST, PATCH, DELETE } from '../api.js';
import { getState, navigate } from '../store.js';
import { statusBadge, priorityEl, fmtDate, avatarHtml, loading, setContent, closeModal, isOverdue } from '../components/shared.js';
import { showModal } from '../components/modal.js';

let taskFilter = 'all';

export async function renderTasks() {
  loading();
  try {
    const user = getState().user;
    const isAdmin = user?.role === 'admin';
    const qs = isAdmin ? '' : `?assignee_id=${user.id}`;
    const { tasks } = await GET(`/tasks${qs}`);

    const filtered = taskFilter === 'all' ? tasks : tasks.filter(t => t.status === taskFilter);
    const counts = { all: tasks.length, todo: 0, in_progress: 0, review: 0, done: 0 };
    tasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

    const rows = filtered.length
      ? filtered.map(t => `
          <tr onclick="window.__openTaskDetail(${t.id})" style="cursor:pointer">
            <td>
              <div style="font-weight:500;font-size:0.82rem">${escapeHtml(t.title)}</div>
              <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">${t.project_name || '—'}</div>
            </td>
            <td>${statusBadge(t.status)}</td>
            <td>${priorityEl(t.priority)}</td>
            <td>
              ${t.assignee_name
                ? `<div class="flex items-center gap-2">${avatarHtml(t.assignee_name, t.assignee_color, 'avatar-sm')}<span style="font-size:0.78rem">${t.assignee_name}</span></div>`
                : '<span class="text-muted" style="font-size:0.78rem">—</span>'}
            </td>
            <td style="font-size:0.78rem;${isOverdue(t.due_date, t.status) ? 'color:var(--danger)' : 'color:var(--text-muted)'}">
              ${fmtDate(t.due_date)}
            </td>
            <td>
              <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();window.__editTask(${t.id})">Edit</button>
            </td>
          </tr>
        `).join('')
      : `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">No tasks ${taskFilter !== 'all' ? 'with this status' : 'yet'}</div></div></td></tr>`;

    const statuses = ['all', 'todo', 'in_progress', 'review', 'done'];
    const filterBtns = statuses.map(s => `
      <button class="filter-btn ${taskFilter === s ? 'active' : ''}" onclick="window.__setTaskFilter('${s}')">
        ${s === 'all' ? 'All' : s.replace('_', ' ')}
        <span style="opacity:0.6">${counts[s] || 0}</span>
      </button>
    `).join('');

    setContent(`
      <div class="page-header">
        <div>
          <div class="page-title">${isAdmin ? 'All Tasks' : 'My Tasks'}</div>
          <div class="page-subtitle">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="window.__createTask()">+ New Task</button>
      </div>
      <div class="filter-bar">${filterBtns}</div>
      <div class="card" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due</th>
                <th style="width:60px"></th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `);

    window.__setTaskFilter = (f) => { taskFilter = f; renderTasks(); };
    window.__createTask = () => openTaskModal();
  } catch (e) {
    setContent(`<div class="alert alert-error">${e.message}</div>`);
  }
}

// ─── TASK MODAL (Create / Edit) ───

async function openTaskModal(taskId = null) {
  try {
    const { projects } = await GET('/projects');
    const { users } = await GET('/users/search?q=');

    let task = null;
    if (taskId) {
      const res = await GET(`/tasks/${taskId}`);
      task = res.task;
    }

    const isEdit = !!task;
    const projectOpts = projects.map(p =>
      `<option value="${p.id}" ${task?.project_id == p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`
    ).join('');

    const userOpts = users.map(u =>
      `<option value="${u.id}" ${task?.assignee_id == u.id ? 'selected' : ''}>${escapeHtml(u.name)}</option>`
    ).join('');

    const statusOpts = ['todo', 'in_progress', 'review', 'done'].map(s =>
      `<option value="${s}" ${task?.status === s ? 'selected' : ''}>${s.replace('_', ' ')}</option>`
    ).join('');

    const priorityOpts = ['low', 'medium', 'high', 'urgent'].map(p =>
      `<option value="${p}" ${task?.priority === p ? 'selected' : ''}>${p}</option>`
    ).join('');

    await showModal(`
      <div class="modal-overlay" onclick="if(event.target===this)window.__closeModal(null)">
        <div class="modal">
          <button class="modal-close" onclick="window.__closeModal(null)">✕</button>
          <div class="modal-title">${isEdit ? 'Edit Task' : 'New Task'}</div>
          <div id="task-modal-alert"></div>
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input type="text" id="t-title" class="form-input" value="${escapeHtml(task?.title || '')}" placeholder="What needs to be done?" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea id="t-desc" class="form-input" placeholder="Add more details..." rows="3">${escapeHtml(task?.description || '')}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Project *</label>
              <select id="t-project" class="form-select">${projectOpts}</select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select id="t-priority" class="form-select">${priorityOpts}</select>
            </div>
            <div class="form-group">
              <label class="form-label">Assignee</label>
              <select id="t-assignee" class="form-select">
                <option value="">Unassigned</option>
                ${userOpts}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Due date</label>
              <input type="date" id="t-due" class="form-input" value="${task?.due_date ? task.due_date.split('T')[0] : ''}" />
            </div>
            ${isEdit ? `
            <div class="form-group">
              <label class="form-label">Status</label>
              <select id="t-status" class="form-select">${statusOpts}</select>
            </div>
            ` : ''}
          </div>
          <div class="modal-footer" style="margin-top:8px">
            ${isEdit ? `<button class="btn btn-danger" onclick="window.__deleteTaskFromModal(${task.id})">Delete</button>` : ''}
            <button class="btn btn-ghost" onclick="window.__closeModal(null)">Cancel</button>
            <button class="btn btn-primary" onclick="window.__submitTask(${isEdit ? task.id : 'null'})">
              ${isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    `);

    window.__submitTask = async (id) => {
      const title = document.getElementById('t-title')?.value.trim();
      const description = document.getElementById('t-desc')?.value.trim();
      const project_id = document.getElementById('t-project')?.value;
      const priority = document.getElementById('t-priority')?.value;
      const assignee_id = document.getElementById('t-assignee')?.value || null;
      const due_date = document.getElementById('t-due')?.value || null;
      const status = document.getElementById('t-status')?.value || null;

      if (!title) {
        const el = document.getElementById('task-modal-alert');
        if (el) el.innerHTML = '<div class="alert alert-error">Title is required.</div>';
        return;
      }

      try {
        if (id) {
          await PATCH(`/tasks/${id}`, { title, description, project_id, priority, assignee_id, due_date, status });
        } else {
          await POST('/tasks', { title, description, project_id, priority, assignee_id, due_date });
        }
        closeModal();
        if (getState().page === 'tasks') renderTasks();
        else navigate('tasks');
      } catch (e) {
        const el = document.getElementById('task-modal-alert');
        if (el) el.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
      }
    };

    window.__deleteTaskFromModal = async (id) => {
      if (!confirm('Delete this task?')) return;
      try {
        await DELETE(`/tasks/${id}`);
        closeModal();
        renderTasks();
      } catch (e) { alert(e.message); }
    };
  } catch (e) {
    closeModal();
    alert('Failed to load form: ' + e.message);
  }
}

// ─── TASK DETAIL ───

export async function openTaskDetail(taskId) {
  try {
    const { task, comments } = await GET(`/tasks/${taskId}`);
    const user = getState().user;

    const commentHtml = comments.length
      ? comments.map(c => `
          <div class="comment-item">
            <div class="flex items-center gap-2" style="margin-bottom:6px">
              ${avatarHtml(c.user_name, c.avatar_color, 'avatar-sm')}
              <strong style="font-size:0.75rem">${escapeHtml(c.user_name)}</strong>
              <span class="text-xs text-muted">${fmtDate(c.created_at)}</span>
            </div>
            <div style="font-size:0.82rem;line-height:1.6">${escapeHtml(c.content)}</div>
          </div>
        `).join('')
      : '<div class="text-sm text-muted" style="padding:8px 0">No comments yet.</div>';

    const statusBtns = ['todo', 'in_progress', 'review', 'done'].map(s => `
      <button class="filter-btn ${task.status === s ? 'active' : ''}"
        onclick="window.__quickStatus(${task.id}, '${s}', this)">
        ${s.replace('_', ' ')}
      </button>
    `).join('');

    await showModal(`
      <div class="modal-overlay" onclick="if(event.target===this)window.__closeModal(null)">
        <div class="modal modal-lg">
          <button class="modal-close" onclick="window.__closeModal(null)">✕</button>

          <div style="margin-bottom:16px">
            <div class="flex items-center gap-2" style="margin-bottom:8px">
              ${priorityEl(task.priority)}
              ${statusBadge(task.status)}
            </div>
            <div style="font-size:1.1rem;font-weight:700;letter-spacing:-0.02em;margin-bottom:6px">
              ${escapeHtml(task.title)}
            </div>
            ${task.description ? `<div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.6">${escapeHtml(task.description)}</div>` : ''}
          </div>

          <div class="task-detail-grid">
            <div class="task-detail-item">
              <div class="task-detail-item-label">Project</div>
              <div class="task-detail-item-value">${escapeHtml(task.project_name) || '—'}</div>
            </div>
            <div class="task-detail-item">
              <div class="task-detail-item-label">Assignee</div>
              <div class="task-detail-item-value">
                ${task.assignee_name
                  ? `<div class="flex items-center gap-2">${avatarHtml(task.assignee_name, task.assignee_color, 'avatar-sm')} ${escapeHtml(task.assignee_name)}</div>`
                  : '—'}
              </div>
            </div>
            <div class="task-detail-item">
              <div class="task-detail-item-label">Due Date</div>
              <div class="task-detail-item-value ${isOverdue(task.due_date, task.status) ? 'overdue-text' : ''}">
                ${fmtDate(task.due_date)}
              </div>
            </div>
            <div class="task-detail-item">
              <div class="task-detail-item-label">Created by</div>
              <div class="task-detail-item-value">${escapeHtml(task.creator_name) || '—'}</div>
            </div>
          </div>

          <div style="margin-bottom:16px">
            <div class="form-label" style="margin-bottom:6px">Update Status</div>
            <div class="status-update-group">${statusBtns}</div>
          </div>

          <div class="divider"></div>

          <div>
            <div class="card-title">Comments</div>
            <div id="comment-list" style="margin-bottom:12px">${commentHtml}</div>
            <div class="flex gap-2">
              <input type="text" id="comment-input" class="form-input"
                placeholder="Add a comment..." style="flex:1"
                onkeydown="if(event.key==='Enter')window.__submitComment(${task.id})" />
              <button class="btn btn-primary btn-sm" onclick="window.__submitComment(${task.id})">Send</button>
            </div>
          </div>

          <div class="modal-footer" style="margin-top:16px">
            <button class="btn btn-secondary btn-sm" onclick="window.__editTask(${task.id})">Edit Task</button>
          </div>
        </div>
      </div>
    `);

    window.__quickStatus = async (id, status, btn) => {
      try {
        await PATCH(`/tasks/${id}`, { status });
        btn.closest('.status-update-group')?.querySelectorAll('.filter-btn')
          .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      } catch (e) { alert(e.message); }
    };

    window.__submitComment = async (id) => {
      const input = document.getElementById('comment-input');
      const content = input?.value.trim();
      if (!content) return;
      try {
        const { comment } = await POST(`/tasks/${id}/comments`, { content });
        input.value = '';
        const list = document.getElementById('comment-list');
        if (list) {
          list.innerHTML += `
            <div class="comment-item">
              <div class="flex items-center gap-2" style="margin-bottom:6px">
                ${avatarHtml(user.name, user.avatar_color, 'avatar-sm')}
                <strong style="font-size:0.75rem">${escapeHtml(user.name)}</strong>
                <span class="text-xs text-muted">Just now</span>
              </div>
              <div style="font-size:0.82rem;line-height:1.6">${escapeHtml(content)}</div>
            </div>
          `;
        }
      } catch (e) { alert(e.message); }
    };
  } catch (e) {
    alert('Failed to load task: ' + e.message);
  }
}

// ─── EVENT LISTENERS ───

export function setupTaskListeners() {
  window.addEventListener('open-task-detail', (e) => {
    if (e.detail?.taskId) openTaskDetail(e.detail.taskId);
  });

  window.addEventListener('create-task', (e) => {
    const projectId = e.detail?.projectId;
    openTaskModal(null);
  });
}

window.__openTaskDetail = (taskId) => openTaskDetail(taskId);
window.__editTask = (taskId) => openTaskModal(taskId);

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
