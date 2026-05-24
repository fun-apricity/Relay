const listeners = new Map();
let state = {
  user: null,
  page: 'dashboard',
  pageParams: {}
};

export function getState() {
  return state;
}

export function setState(updates) {
  state = { ...state, ...updates };
  listeners.forEach((fn, key) => {
    if (key === '*' || updates[key] !== undefined) fn(state);
  });
}

export function subscribe(key, fn) {
  listeners.set(key, fn);
  return () => listeners.delete(key);
}

export function navigate(page, params = {}) {
  setState({ page, pageParams: params });
}
