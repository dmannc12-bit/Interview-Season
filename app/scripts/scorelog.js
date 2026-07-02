window.ISF = window.ISF || {};

(function () {
  const ROUND_LABELS = { behavioral: 'Behavioral', technical: 'Technical', superday: 'Superday' };

  const COMPETENCIES = {
    behavioral: ['Structure & Clarity', 'Specificity & Depth', 'Motivation & Fit', 'Executive Presence', 'Self-Awareness'],
    technical: ['Technical Accuracy', 'Reasoning Process', 'Communication Clarity', 'Composure Under Pressure'],
    superday: ['Behavioral Performance', 'Technical Performance', 'Fit & Presence', 'Composure Under Fatigue', 'Consistency'],
  };

  // Where to send someone to actually work on a named weak area — same-page anchors
  // for story-bank/framework-skeletons/protocols, cross-page for the resume prompt.
  const RESOURCE_MAP = {
    'Structure & Clarity': { label: 'the Story Bank', href: '#story-bank' },
    'Specificity & Depth': { label: 'the Story Bank', href: '#story-bank' },
    'Self-Awareness': { label: 'the Story Bank', href: '#story-bank' },
    'Behavioral Performance': { label: 'the Story Bank', href: '#story-bank' },
    'Motivation & Fit': { label: 'the "Why This Firm" Generator', href: 'resume.html#why-firm' },
    'Fit & Presence': { label: 'the "Why This Firm" Generator', href: 'resume.html#why-firm' },
    'Technical Accuracy': { label: 'the Framework skeletons', href: '#framework-skeletons' },
    'Reasoning Process': { label: 'the Framework skeletons', href: '#framework-skeletons' },
    'Technical Performance': { label: 'the Framework skeletons', href: '#framework-skeletons' },
    'Executive Presence': { label: 'another round', href: '#protocols' },
    'Communication Clarity': { label: 'another round', href: '#protocols' },
    'Composure Under Pressure': { label: 'another round', href: '#protocols' },
    'Composure Under Fatigue': { label: 'another round', href: '#protocols' },
    'Consistency': { label: 'another round', href: '#protocols' },
  };

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function uid() {
    return `score-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function sortedEntries() {
    const log = window.ISF.AppState.get().scoreLog || [];
    return [...log].sort((a, b) => a.date.localeCompare(b.date));
  }

  function renderChart() {
    const wrap = document.getElementById('score-summary');
    if (!wrap) return;
    const entries = sortedEntries();

    if (!entries.length) {
      wrap.innerHTML = `<div class="empty-state">No interviews logged yet. Run one, then log your score below — this is where you'll watch yourself get sharper.</div>`;
      return;
    }

    const first = entries[0].score;
    const latest = entries[entries.length - 1].score;
    const delta = latest - first;
    const deltaText = entries.length > 1
      ? (delta > 0 ? ` — up ${delta.toFixed(1)} since your first` : delta < 0 ? ` — down ${Math.abs(delta).toFixed(1)} since your first` : ' — holding steady')
      : '';

    wrap.innerHTML = `
      <div class="score-summary__stat">
        <strong>${entries.length}</strong> interview${entries.length === 1 ? '' : 's'} logged &middot; latest <strong>${latest.toFixed(1)} / 10</strong>${deltaText}
      </div>
      <div class="score-chart" id="score-chart" aria-hidden="true">
        ${entries.map((e) => `<div class="score-chart__bar" data-round="${e.round}" data-score="${e.score}" title="${escapeHtml(ROUND_LABELS[e.round] || e.round)} — ${e.score.toFixed(1)} / 10 on ${e.date}"></div>`).join('')}
      </div>`;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bars = wrap.querySelectorAll('.score-chart__bar[data-score]');
    if (reduceMotion) {
      bars.forEach((el) => { el.style.height = `${(el.dataset.score / 10) * 96}px`; });
      return;
    }
    const io = new IntersectionObserver((obsEntries) => {
      obsEntries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const i = [...bars].indexOf(el);
          setTimeout(() => {
            el.style.height = `${(el.dataset.score / 10) * 96}px`;
          }, i * 50);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    bars.forEach((el) => io.observe(el));
  }

  function renderList() {
    const listEl = document.getElementById('score-log-list');
    if (!listEl) return;
    const entries = [...(window.ISF.AppState.get().scoreLog || [])].sort((a, b) => b.date.localeCompare(a.date));

    if (!entries.length) {
      listEl.innerHTML = '';
      return;
    }

    listEl.innerHTML = entries.map((e) => {
      const resource = RESOURCE_MAP[e.weakArea];
      return `
      <div class="score-log-item" data-id="${e.id}">
        <div class="score-log-item__head">
          <div class="score-log-item__meta">
            <span class="score-log-item__date">${e.date}</span>
            <span class="score-log-item__round">${escapeHtml(ROUND_LABELS[e.round] || e.round)}</span>
          </div>
          <div class="cluster" style="gap:12px">
            <span class="score-log-item__score">${e.score.toFixed(1)} / 10</span>
            <button class="icon-btn is-danger" data-action="delete" aria-label="Delete entry">${window.ISF.icon('trash')}</button>
          </div>
        </div>
        ${e.weakArea ? `<div class="score-log-item__body"><strong>Weakest area:</strong> ${escapeHtml(e.weakArea)}</div>` : ''}
        ${e.note ? `<div class="score-log-item__body">${escapeHtml(e.note)}</div>` : ''}
        ${resource ? `<a class="score-log-item__fix" href="${resource.href}">Work on this in ${resource.label} <span class="arrow" aria-hidden="true">→</span></a>` : ''}
      </div>`;
    }).join('');

    listEl.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.score-log-item').dataset.id;
        window.ISF.AppState.update((s) => {
          s.scoreLog = s.scoreLog.filter((x) => x.id !== id);
        });
        window.ISF.toast('Entry removed');
        renderChart();
        renderList();
      });
    });
  }

  function weakAreaOptions(round) {
    return (COMPETENCIES[round] || [])
      .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
      .join('');
  }

  function renderForm() {
    const formWrap = document.getElementById('score-log-form-wrap');
    if (!formWrap) return;
    const today = new Date().toISOString().slice(0, 10);

    formWrap.innerHTML = `
      <form class="score-log-form" id="score-log-form">
        <div class="field">
          <label for="score-date">Date</label>
          <input id="score-date" type="date" value="${today}" required>
        </div>
        <div class="field">
          <label for="score-round">Round</label>
          <select id="score-round">
            <option value="behavioral">Behavioral</option>
            <option value="technical">Technical</option>
            <option value="superday">Superday</option>
          </select>
        </div>
        <div class="field">
          <label for="score-value">Overall score</label>
          <input id="score-value" type="number" min="0" max="10" step="0.1" placeholder="7.5" required>
        </div>
        <div class="field">
          <label for="score-weak">Weakest area</label>
          <select id="score-weak">
            <option value="">— none noted —</option>
            ${weakAreaOptions('behavioral')}
          </select>
        </div>
        <div class="field span-4">
          <label for="score-note">One thing to fix before the next round</label>
          <textarea id="score-note" placeholder="What did the scorecard tell you to fix?"></textarea>
        </div>
        <div class="span-4">
          <button type="submit" class="btn btn-primary">Log this score</button>
        </div>
      </form>`;

    const roundSelect = document.getElementById('score-round');
    const weakSelect = document.getElementById('score-weak');

    roundSelect.addEventListener('change', () => {
      weakSelect.innerHTML = `<option value="">— none noted —</option>${weakAreaOptions(roundSelect.value)}`;
    });

    document.getElementById('score-log-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const score = parseFloat(document.getElementById('score-value').value);
      if (Number.isNaN(score) || score < 0 || score > 10) {
        window.ISF.toast('Enter a score between 0 and 10');
        return;
      }
      const entry = {
        id: uid(),
        date: document.getElementById('score-date').value || today,
        round: roundSelect.value,
        score,
        weakArea: weakSelect.value,
        note: document.getElementById('score-note').value.trim(),
      };
      window.ISF.AppState.update((s) => { s.scoreLog.push(entry); });
      window.ISF.toast('Score logged');
      renderForm();
      renderChart();
      renderList();
    });
  }

  window.ISF.initScoreLog = function () {
    if (!document.getElementById('score-log-form-wrap')) return;
    renderForm();
    renderChart();
    renderList();
  };
})();
