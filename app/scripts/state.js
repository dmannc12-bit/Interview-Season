/* Single consolidated localStorage schema for all app state (experience-layer only —
   the pipeline/contacts tracker lives in the Google Sheet, not here).
   Plain script (no ES modules) so the app runs unmodified from file://. */
window.ISF = window.ISF || {};

const STORAGE_KEY = 'isf_state_v1';

const DEFAULT_STATE = {
  version: 1,
  onboarding: { completed: false },
  storyBank: [],
  scoreLog: [],
  promptVars: {},
  checklist: {},
  weeklyOS: {},
};

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_STATE), ...parsed };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

window.ISF.AppState = {
  get() {
    return readState();
  },
  update(mutator) {
    const state = readState();
    mutator(state);
    writeState(state);
    return state;
  },
  reset() {
    localStorage.removeItem(STORAGE_KEY);
  },
  exportJSON() {
    const state = readState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interview-season-data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  importJSON(file) {
    return file.text().then((text) => {
      const parsed = JSON.parse(text);
      writeState({ ...structuredClone(DEFAULT_STATE), ...parsed });
    });
  },
};
