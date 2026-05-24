import { GET, PATCH } from '../api.js';
import { avatarHtml, fmtDate, loading, setContent } from '../components/shared.js';

export async function renderTeam() {
  loading();
  try {
    const { users } = await GET('/users');

    const rows = users.map(u => `
      <tr>
        <td>
          <div class="flex items-center gap-3">
            ${avatarHtml(u.name, u.avatar_color)}
            <div>
              <div style="font-weight:500;font-size:0.82rem">${escapeHtml(u.name)}</div>
              <div style="font-size:0.7rem;color:var(--text-muted)">${u.email}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge ${u.role === 'admin' ? 'badge-admin' : 'badge-todo'}"
            style="text-transform:capitalize">${u.role}</span>
        </td>
        <td style="font-size:0.78rem;color:var(--text-muted)">${fmtDate(u.created_at)}</td>
        <td>
          <select class="form-select" style="width:auto;padding:4px 28px 4px 8px;font-size:0.72rem"
            onchange="window.__updateUserRole(${u.id}, this.value)"
            ${u.id === window.__currentUserId ? 'disabled' : ''}>
            <option value="member" ${u.role === 'member' ? 'selected' : ''}>Member</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </td>
      </tr>
    `).join('');

    setContent(`
      <div class="page-header">
        <div>
          <div class="page-title">Team</div>
          <div class="page-subtitle">${users.length} member${users.length !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <div class="card" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
                <th style="width:120px">Change Role</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `);

    window.__updateUserRole = async (userId, role) => {
      try {
        await PATCH(`/users/${userId}/role`, { role });
      } catch (e) {
        alert(e.message);
      }
    };
  } catch (e) {
    setContent(`<div class="alert alert-error">${e.message}</div>`);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
