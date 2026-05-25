import { GET } from '../api.js';
import { getState } from '../store.js';
import { statusBadge, priorityEl, fmtDate, avatarHtml, loading, setContent, isOverdue } from '../components/shared.js';

export async function renderDashboard() {
  loading();
  try {
    const d = await GET('/dashboard');
    const { taskStats: t, projectStats: p, recentTasks, overdueTasks, userCount } = d;
    const user = getState().user;
    const isAdmin = user?.role === 'admin';
    const greeting = getGreeting();

    const statCards = `
      <div class="grid-4" style="margin-bottom:24px">
        <div class="stat-card" style="--accent:var(--primary)">
          <div class="stat-label">Total Tasks</div>
          <div class="stat-value">${t.total}</div>
        </div>
        <div class="stat-card" style="--accent:var(--info)">
          <div class="stat-label">In Progress</div>
          <div class="stat-value">${t.in_progress}</div>
        </div>
        <div class="stat-card" style="--accent:var(--success)">
          <div class="stat-label">Completed</div>
          <div class="stat-value">${t.done}</div>
        </div>
        <div class="stat-card" style="--accent:var(--danger)">
          <div class="stat-label">Overdue</div>
          <div class="stat-value">${t.overdue}</div>
        </div>
        ${isAdmin ? `
        <div class="stat-card" style="--accent:#8b5cf6">
          <div class="stat-label">Team</div>
          <div class="stat-value">${userCount}</div>
        </div>
        <div class="stat-card" style="--accent:#f59e0b">
          <div class="stat-label">Projects</div>
          <div class="stat-value">${p.total}</div>
        </div>
        <div class="stat-card" style="--accent:var(--success)">
          <div class="stat-label">Completed</div>
          <div class="stat-value">${p.completed}</div>
        </div>
        <div class="stat-card" style="--accent:var(--info)">
          <div class="stat-label">Active</div>
          <div class="stat-value">${p.active}</div>
        </div>
        ` : ''}
      </div>
    `;

    const recentHtml = recentTasks.length
      ? recentTasks.map(t => `
        <div class="task-row" onclick="window.__openTaskDetail(${t.id})">
          <div class="task-check ${t.status === 'done' ? 'done' : ''}"></div>
          <div class="task-title-cell ${t.status === 'done' ? 'done' : ''}">
            ${t.title}
          </div>
          <div class="text-sm" style="color:var(--text-muted);margin-right:8px">${t.project_name || ''}</div>
          ${statusBadge(t.status)}
        </div>
      `).join('')
      : `<div class="empty-state"><div class="empty-title">No tasks yet</div><div class="empty-desc">Create your first task to get started.</div></div>`;

    const overdueHtml = overdueTasks.length
      ? `<table>
          <thead><tr><th>Task</th><th>Project</th><th>Priority</th><th>Due</th></tr></thead>
          <tbody>
            ${overdueTasks.map(t => `
              <tr style="cursor:pointer" onclick="window.__openTaskDetail(${t.id})">
                <td><div class="truncate" style="max-width:180px;font-weight:500">${t.title}</div></td>
                <td><span class="text-sm text-muted">${t.project_name || '—'}</span></td>
                <td>${priorityEl(t.priority)}</td>
                <td style="color:var(--danger);font-size:0.78rem">${fmtDate(t.due_date)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`
      : `<div class="empty-state" style="padding:32px"><div class="empty-title">No overdue tasks</div></div>`;

    setContent(`
      <div class="page-header">
        <div>
          <div class="page-title">${greeting}, ${user?.name?.split(' ')[0] || 'there'}<span style="color:var(--primary)">.</span></div>
          <div class="page-subtitle">Here's what's happening across your workspace</div>
        </div>
      </div>
      ${statCards}
      <div class="grid-2">
        <div class="card">
          <div class="card-title">Recent Tasks</div>
          ${recentHtml}
        </div>
        <div class="card">
          <div class="card-title">Overdue</div>
          ${overdueHtml}
        </div>
      </div>
    `);
  } catch (e) {
    setContent(`<div class="alert alert-error">Failed to load dashboard: ${e.message}</div>`);
  }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
