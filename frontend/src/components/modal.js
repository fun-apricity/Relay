let resolveCallback = null;

export function showModal(html) {
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  return new Promise((resolve) => {
    resolveCallback = resolve;
  });
}

export function closeModal(result = null) {
  const container = document.getElementById('modal-container');
  container.innerHTML = '';
  if (resolveCallback) {
    resolveCallback(result);
    resolveCallback = null;
  }
}

export function showConfirm(title, message) {
  return showModal(`
    <div class="modal-overlay" onclick="if(event.target===this)window.__closeModal(false)">
      <div class="modal" style="width:380px">
        <div class="modal-title">${title}</div>
        <p style="font-size:0.82rem;color:var(--text-muted);line-height:1.6;margin-bottom:20px">${message}</p>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="window.__closeModal(false)">Cancel</button>
          <button class="btn btn-danger" onclick="window.__closeModal(true)">Confirm</button>
        </div>
      </div>
    </div>
  `);
}

// Make closeModal available globally for inline onclick handlers
window.__closeModal = (result) => {
  closeModal(result);
};
