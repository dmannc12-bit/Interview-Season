window.ISF = window.ISF || {};

(function () {
  let region = null;

  function ensureRegion() {
    if (region) return region;
    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
    return region;
  }

  const ICONS = {
    success:
      '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5l3.5 3.5L16 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    error:
      '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 6v5M10 14v.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };

  window.ISF.toast = function (message, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast is-${type}`;
    el.innerHTML = `${ICONS[type] || ''}<span>${message}</span>`;
    ensureRegion().appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 260);
    }, 2400);
  };
})();
