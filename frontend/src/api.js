const API = 'https://taskflow-production-3dc1.up.railway.app/api';

export async function api(method, path, body = null) {
  const token = localStorage.getItem('tf_token');
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const GET = (path) => api('GET', path);
export const POST = (path, body) => api('POST', path, body);
export const PATCH = (path, body) => api('PATCH', path, body);
export const DELETE = (path) => api('DELETE', path);
