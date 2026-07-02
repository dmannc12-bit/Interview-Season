window.ISF = window.ISF || {};

(function () {
  window.ISF.initLaunchProgress = function () {
    const ring = document.querySelector('.progress-ring');
    const countEl = document.getElementById('launch-progress-count');
    if (!ring) return;

    function update() {
      const boxes = document.querySelectorAll('[data-checklist-key^="launch-day"]');
      const total = boxes.length;
      const done = [...boxes].filter((b) => b.checked).length;
      window.ISF.setProgressRing(ring, total ? done / total : 0);
      if (countEl) countEl.textContent = `${done} / ${total} steps done`;
    }

    update();
    document.addEventListener('isf:checklist-change', update);
  };

  window.ISF.initWeeklyOS = function () {
    const resetBtn = document.getElementById('weekly-os-reset');
    resetBtn?.addEventListener('click', () => {
      window.ISF.AppState.update((s) => {
        Object.keys(s.checklist).forEach((key) => {
          if (key.startsWith('weekly-')) delete s.checklist[key];
        });
      });
      document.querySelectorAll('[data-checklist-key^="weekly-"]').forEach((box) => {
        box.checked = false;
      });
      window.ISF.toast('Weekly OS reset — fresh week');
    });
  };
})();
