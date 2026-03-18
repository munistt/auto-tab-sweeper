const SETTINGS_KEY = 'settings';

const els = {
  threshold: document.getElementById('threshold'),
  compareMode: document.getElementById('compareMode'),
  protectPinned: document.getElementById('protectPinned'),
  protectAudible: document.getElementById('protectAudible'),
  whitelist: document.getElementById('whitelist'),
  sweepInterval: document.getElementById('sweepInterval'),
  save: document.getElementById('save'),
  status: document.getElementById('status')
};

const DEFAULTS = {
  thresholdMinutes: 3000,
  compareMode: 'ignoreQuery',
  protectPinned: true,
  protectAudible: true,
  whitelist: [],
  sweepIntervalMinutes: 5
};

function arrayToTextarea(list) {
  return (list || []).join('\n');
}

function textareaToArray(text) {
  return text
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const s = { ...DEFAULTS, ...(stored[SETTINGS_KEY] || {}) };

  els.threshold.value = s.thresholdMinutes;
  els.compareMode.value = s.compareMode;
  els.protectPinned.checked = !!s.protectPinned;
  els.protectAudible.checked = !!s.protectAudible;
  els.whitelist.value = arrayToTextarea(s.whitelist);
  els.sweepInterval.value = s.sweepIntervalMinutes;
}

async function saveSettings() {
  els.save.disabled = true;
  els.status.textContent = 'Saving...';

  const s = {
    thresholdMinutes: Math.max(1, parseInt(els.threshold.value, 10) || DEFAULTS.thresholdMinutes),
    compareMode: els.compareMode.value,
    protectPinned: !!els.protectPinned.checked,
    protectAudible: !!els.protectAudible.checked,
    whitelist: textareaToArray(els.whitelist.value),
    sweepIntervalMinutes: Math.max(1, parseInt(els.sweepInterval.value, 10) || DEFAULTS.sweepIntervalMinutes)
  };

  await chrome.storage.local.set({ [SETTINGS_KEY]: s });

  els.status.textContent = 'Saved!';
  els.save.disabled = false;
  setTimeout(() => (els.status.textContent = ''), 1500);
}

document.addEventListener('DOMContentLoaded', loadSettings);
els.save.addEventListener('click', saveSettings);