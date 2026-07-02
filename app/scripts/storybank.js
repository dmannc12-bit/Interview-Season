window.ISF = window.ISF || {};

(function () {
  const COMPETENCIES = [
    'Leadership', 'Teamwork & Collaboration', 'Conflict Resolution', 'Failure & Resilience',
    'Initiative', 'Analytical / Problem-Solving', 'Client & Stakeholder Management', 'Time Management Under Pressure',
  ];

  function uid() {
    return `story-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  window.ISF.formatStoriesForPrompt = function () {
    const stories = window.ISF.AppState.get().storyBank || [];
    if (!stories.length) return '';
    return stories.map((s, i) => (
      `Story ${i + 1} — ${s.title} (${s.competency})\n` +
      `Situation: ${s.situation}\n` +
      `Task: ${s.task}\n` +
      `Action: ${s.action}\n` +
      `Result: ${s.result}`
    )).join('\n\n');
  };

  function renderForm(container, editingStory) {
    container.innerHTML = `
      <form class="story-form" id="story-form">
        <div class="field span-2">
          <label for="story-title">Story title</label>
          <input id="story-title" required placeholder="e.g. Turned around a failing group project" value="${escapeHtml(editingStory?.title || '')}">
        </div>
        <div class="field">
          <label for="story-competency">Competency</label>
          <select id="story-competency">
            ${COMPETENCIES.map((c) => `<option ${editingStory?.competency === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="field"></div>
        <div class="field span-2">
          <label for="story-situation">Situation</label>
          <textarea id="story-situation" placeholder="What was the context? Where, when, who was involved?">${escapeHtml(editingStory?.situation || '')}</textarea>
        </div>
        <div class="field span-2">
          <label for="story-task">Task</label>
          <textarea id="story-task" placeholder="What were you responsible for? What was the goal?">${escapeHtml(editingStory?.task || '')}</textarea>
        </div>
        <div class="field span-2">
          <label for="story-action">Action</label>
          <textarea id="story-action" placeholder="What did you specifically do? Be concrete — first person, active verbs.">${escapeHtml(editingStory?.action || '')}</textarea>
        </div>
        <div class="field span-2">
          <label for="story-result">Result</label>
          <textarea id="story-result" placeholder="What happened? Quantify it if you can.">${escapeHtml(editingStory?.result || '')}</textarea>
        </div>
        <div class="span-2 cluster" style="gap:12px">
          <button type="submit" class="btn btn-primary">${editingStory ? 'Save changes' : 'Add story'}</button>
          ${editingStory ? '<button type="button" class="btn btn-ghost" id="story-cancel">Cancel</button>' : ''}
        </div>
      </form>`;

    container.querySelector('#story-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const story = {
        id: editingStory?.id || uid(),
        title: container.querySelector('#story-title').value.trim(),
        competency: container.querySelector('#story-competency').value,
        situation: container.querySelector('#story-situation').value.trim(),
        task: container.querySelector('#story-task').value.trim(),
        action: container.querySelector('#story-action').value.trim(),
        result: container.querySelector('#story-result').value.trim(),
      };
      if (!story.title) return;
      window.ISF.AppState.update((s) => {
        const idx = s.storyBank.findIndex((x) => x.id === story.id);
        if (idx >= 0) s.storyBank[idx] = story;
        else s.storyBank.push(story);
      });
      window.ISF.toast(editingStory ? 'Story updated' : 'Story added to your bank');
      renderForm(container, null);
      renderList();
    });

    container.querySelector('#story-cancel')?.addEventListener('click', () => renderForm(container, null));
  }

  function renderList() {
    const listEl = document.getElementById('story-list');
    if (!listEl) return;
    const stories = window.ISF.AppState.get().storyBank || [];
    if (!stories.length) {
      listEl.innerHTML = `<div class="empty-state">No stories yet. Add your first one above — three or four strong ones cover most behavioral rounds.</div>`;
      return;
    }
    listEl.innerHTML = stories.map((s) => `
      <div class="story-item" data-id="${s.id}">
        <div class="story-item__head">
          <div>
            <span class="story-item__tag">${escapeHtml(s.competency)}</span>
            <div class="story-item__title" style="margin-top:6px">${escapeHtml(s.title)}</div>
          </div>
          <div class="story-item__actions">
            <button class="icon-btn" data-action="edit" aria-label="Edit story">${window.ISF.icon('edit')}</button>
            <button class="icon-btn is-danger" data-action="delete" aria-label="Delete story">${window.ISF.icon('trash')}</button>
          </div>
        </div>
        <div class="story-item__body"><strong>Result:</strong> ${escapeHtml(s.result || '—')}</div>
      </div>`).join('');

    listEl.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.story-item').dataset.id;
        window.ISF.AppState.update((s) => {
          s.storyBank = s.storyBank.filter((x) => x.id !== id);
        });
        window.ISF.toast('Story removed');
        renderList();
      });
    });
    listEl.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.story-item').dataset.id;
        const story = (window.ISF.AppState.get().storyBank || []).find((x) => x.id === id);
        const formWrap = document.getElementById('story-form-wrap');
        if (story && formWrap) {
          renderForm(formWrap, story);
          formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  window.ISF.initStoryBank = function () {
    const formWrap = document.getElementById('story-form-wrap');
    if (!formWrap) return;
    renderForm(formWrap, null);
    renderList();

    document.getElementById('story-export')?.addEventListener('click', () => {
      window.ISF.AppState.exportJSON();
      window.ISF.toast('Story bank exported as JSON');
    });
  };
})();
