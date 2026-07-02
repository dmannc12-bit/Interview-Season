window.ISF = window.ISF || {};

(function () {
  const NAV_ITEMS = [
    { id: 'onboarding', href: 'index.html', label: 'Start Here', icon: 'home' },
    { id: 'interview', href: 'interview.html', label: 'Mock Interviewer', icon: 'mic' },
    { id: 'resume', href: 'resume.html', label: 'Resume & Apps', icon: 'briefcase' },
    { id: 'networking', href: 'networking.html', label: 'Networking', icon: 'users' },
    { id: 'playbook', href: 'playbook.html', label: 'Playbook & OS', icon: 'compass' },
  ];

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function labelize(v) {
    return v.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
  }

  /* ---------------------------------- nav ---------------------------------- */
  window.ISF.renderNav = function (activeId) {
    const root = document.getElementById('nav-root');
    if (!root) return;
    root.innerHTML = `
      <header class="app-nav">
        <div class="app-nav__brand">
          <span class="signal-dot" aria-hidden="true"></span>
          <span class="app-nav__word">Interview Season</span>
        </div>
        <button class="app-nav__toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">
          ${window.ISF.icon('menu', 'app-nav__toggle-icon-open')}
          ${window.ISF.icon('close', 'app-nav__toggle-icon-close')}
        </button>
        <nav class="app-nav__links" aria-label="Primary">
          ${NAV_ITEMS.map((item) => `
            <a href="${item.href}" class="app-nav__link ${item.id === activeId ? 'is-active' : ''}" ${item.id === activeId ? 'aria-current="page"' : ''}>
              ${window.ISF.icon(item.icon)}
              <span>${item.label}</span>
            </a>`).join('')}
        </nav>
      </header>`;

    const toggle = root.querySelector('.app-nav__toggle');
    const links = root.querySelector('.app-nav__links');
    toggle?.addEventListener('click', () => {
      const isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  };

  /* ---------------------------------- clipboard ---------------------------------- */
  window.ISF.copyToClipboard = function (text) {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    return Promise.resolve();
  };

  /* ---------------------------------- prompt cards ---------------------------------- */
  window.ISF.initPromptCards = function (root = document) {
    root.querySelectorAll('.prompt-card').forEach((card) => {
      const templateEl = card.querySelector('.prompt-card__template');
      const body = card.querySelector('.prompt-card__body');
      const fieldsWrap = card.querySelector('.prompt-card__fields');
      if (!templateEl || !body) return;

      const template = templateEl.textContent.trim();
      const promptId = card.dataset.promptId || 'prompt';
      const varNames = [...new Set([...template.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))];
      const saved = (window.ISF.AppState.get().promptVars || {})[promptId] || {};

      const LONG_VARS = new Set(['stories', 'story', 'notes', 'jd', 'jobdescription']);

      if (varNames.length && fieldsWrap) {
        fieldsWrap.innerHTML = varNames.map((v) => {
          const isLong = LONG_VARS.has(v.toLowerCase());
          const fieldClass = isLong ? 'field span-2' : 'field';
          const control = isLong
            ? `<textarea id="${promptId}-${v}" data-var="${v}" placeholder="e.g. ${labelize(v)}">${escapeHtml(saved[v] || '')}</textarea>`
            : `<input id="${promptId}-${v}" type="text" data-var="${v}" value="${escapeHtml(saved[v] || '')}" placeholder="e.g. ${labelize(v)}" autocomplete="off">`;
          const storyHelper = v.toLowerCase() === 'stories'
            ? `<button type="button" class="btn-text story-fill" data-target="${promptId}-${v}">Insert from Story Bank <span class="arrow" aria-hidden="true">→</span></button>`
            : '';
          return `<div class="${fieldClass}"><label for="${promptId}-${v}">${labelize(v)}</label>${control}${storyHelper}</div>`;
        }).join('');
      } else if (fieldsWrap) {
        fieldsWrap.remove();
      }

      fieldsWrap?.querySelectorAll('.story-fill').forEach((btn) => {
        btn.addEventListener('click', () => {
          const target = document.getElementById(btn.dataset.target);
          if (!target || !window.ISF.formatStoriesForPrompt) return;
          target.value = window.ISF.formatStoriesForPrompt();
          target.dispatchEvent(new Event('input'));
        });
      });

      function currentValues() {
        const values = {};
        fieldsWrap?.querySelectorAll('[data-var]').forEach((input) => {
          values[input.dataset.var] = input.value;
        });
        return values;
      }

      function render() {
        const values = currentValues();
        let html = escapeHtml(template);
        html = html.replace(/\{\{(\w+)\}\}/g, (_, v) => {
          const val = values[v];
          return `<span class="chip ${val ? 'is-filled' : ''}">${val ? escapeHtml(val) : `{{${v}}}`}</span>`;
        });
        body.innerHTML = html;
        const plain = template.replace(/\{\{(\w+)\}\}/g, (_, v) => values[v] || `[${labelize(v)}]`);
        return plain;
      }

      let currentPlain = render();

      fieldsWrap?.querySelectorAll('[data-var]').forEach((input) => {
        input.addEventListener('input', () => {
          currentPlain = render();
          window.ISF.AppState.update((s) => {
            s.promptVars[promptId] = currentValues();
          });
        });
      });

      const copyBtn = card.querySelector('.copy-btn');
      copyBtn?.addEventListener('click', () => {
        currentPlain = render();
        window.ISF.copyToClipboard(currentPlain).then(() => {
          const original = copyBtn.innerHTML;
          copyBtn.classList.add('is-copied');
          copyBtn.innerHTML = `${window.ISF.icon('check')}<span>Copied</span>`;
          window.ISF.toast('Prompt copied — paste it into Claude');
          setTimeout(() => {
            copyBtn.classList.remove('is-copied');
            copyBtn.innerHTML = original;
          }, 2000);
        });
      });
    });
  };

  /* ---------------------------------- segmented controls ---------------------------------- */
  window.ISF.initSegmented = function (root = document) {
    root.querySelectorAll('.segmented').forEach((group) => {
      group.querySelectorAll('button:not(:disabled)').forEach((btn) => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
          btn.setAttribute('aria-pressed', 'true');
          group.dispatchEvent(new CustomEvent('isf:segment-change', { detail: { value: btn.dataset.value }, bubbles: true }));
        });
      });
    });
  };

  /* ---------------------------------- prompt hints ---------------------------------- */
  window.ISF.initPromptHints = function (root = document) {
    root.querySelectorAll('.prompt-hint__icon').forEach((el) => {
      el.innerHTML = window.ISF.icon('info');
    });
  };

  /* ---------------------------------- checklist persistence ---------------------------------- */
  window.ISF.initChecklist = function (root = document) {
    root.querySelectorAll('[data-checklist-key]').forEach((input) => {
      const key = input.dataset.checklistKey;
      const state = window.ISF.AppState.get();
      input.checked = !!state.checklist[key];
      input.addEventListener('change', () => {
        window.ISF.AppState.update((s) => {
          s.checklist[key] = input.checked;
        });
        document.dispatchEvent(new CustomEvent('isf:checklist-change'));
      });
    });
  };

  /* ---------------------------------- scorecard reveal ---------------------------------- */
  window.ISF.initScorecards = function (root = document) {
    const fills = root.querySelectorAll('.scorecard__fill[data-score]');
    if (!fills.length) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      fills.forEach((el) => { el.style.width = `${el.dataset.score}%`; });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          setTimeout(() => {
            el.style.width = `${el.dataset.score}%`;
          }, i * 60);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    fills.forEach((el) => io.observe(el));
  };

  /* ---------------------------------- scroll reveal ---------------------------------- */
  window.ISF.initReveal = function (selector, root = document) {
    const els = root.querySelectorAll(selector);
    if (!els.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
  };

  /* ---------------------------------- progress ring ---------------------------------- */
  window.ISF.setProgressRing = function (el, fraction) {
    const circle = el.querySelector('.fill');
    if (!circle) return;
    const r = circle.r.baseVal.value;
    const c = 2 * Math.PI * r;
    circle.style.strokeDasharray = `${c}`;
    circle.style.strokeDashoffset = `${c * (1 - fraction)}`;
  };
})();
