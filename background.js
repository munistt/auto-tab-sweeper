// Tab De-duper & Auto-Close - background service worker (MV3)

const DEFAULTS = {
  thresholdMinutes: 1,           // close duplicates older than this
  compareMode: 'ignoreQuery',     // 'exact' | 'ignoreQuery' | 'hostnamePath'
  protectPinned: true,
  protectAudible: true,
  whitelist: [
    // Add patterns like "*://*.teams.microsoft.com/*", "*://*.meet.google.com/*"
  ],
  sweepIntervalMinutes: 5         // how often to scan
};

const SETTINGS_KEY = 'settings';

async function getSettings() {
  const { [SETTINGS_KEY]: s } = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULTS, ...(s || {}) };
}

async function setSettings(patch) {
  const current = await getSettings();
  const updated = { ...current, ...patch };
  await chrome.storage.local.set({ [SETTINGS_KEY]: updated });
  return updated;
}

function wildcardToRegExp(pattern) {
  // Converts match patterns like "*://*.example.com/*" to a RegExp
  // Note: This is a simple converter for our whitelist purpose.
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // escape regex specials
    .replace(/\\\*/g, '.*');               // * -> .*
  return new RegExp('^' + escaped + '$');
}

function isWhitelisted(url, whitelist) {
  try {
    return whitelist.some(p => wildcardToRegExp(p).test(url));
  } catch (e) {
    // If a pattern is malformed, ignore it
    return false;
  }
}

function normalizeUrl(rawUrl, mode) {
  try {
    const u = new URL(rawUrl);
    switch (mode) {
      case 'exact': {
        // strip hash only (keeps query)
        u.hash = '';
        return u.toString();
      }
      case 'ignoreQuery': {
        // ignore query and hash
        return `${u.origin}${u.pathname}`;
      }
      case 'hostnamePath': {
        // compare by host + path only
        return `${u.hostname}${u.pathname}`;
      }
      default:
        return `${u.origin}${u.pathname}`;
    }
  } catch {
    // if URL invalid (chrome:// etc.), fallback to raw
    return rawUrl;
  }
}

async function sweepDuplicates() {
  const settings = await getSettings();
  const now = Date.now();
  const thresholdMs = settings.thresholdMinutes * 60 * 1000;

  // Get all tabs across windows (normal + incognito if user allowed incognito)
  const tabs = await chrome.tabs.query({});

  // Group tabs by normalized URL (only http/https usually; special schemes included)
  const groups = new Map();
  for (const t of tabs) {
    // Skip tabs without URL (e.g., new tab page) or chrome:// where applicable
    if (!t.url) continue;

    // Respect whitelist
    if (settings.whitelist && settings.whitelist.length && isWhitelisted(t.url, settings.whitelist)) {
      continue;
    }

    const key = normalizeUrl(t.url, settings.compareMode);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }

  const toClose = [];

  for (const [key, group] of groups) {
    if (group.length <= 1) continue;

    // Find active tab in this group if any - it must be protected
    const activeTab = group.find(t => t.active);
    
    // Determine the "keeper": prioritize active tab, otherwise most recently accessed
    const withAccess = group.map(t => ({
      tab: t,
      last: typeof t.lastAccessed === 'number' ? t.lastAccessed : (t.active ? now : 0)
    }));

    // Sort descending by recency
    withAccess.sort((a, b) => b.last - a.last);
    const keeper = activeTab || withAccess[0].tab;

    // Consider others for closure
    for (const item of withAccess) {
      const t = item.tab;

      // NEVER close the keeper
      if (t.id === keeper.id) continue;

      // Don't close the active tab (safety)
      if (t.active) continue;

      // Respect pinned tabs if configured
      if (settings.protectPinned && t.pinned) continue;

      // Respect audible tabs if configured
      if (settings.protectAudible && t.audible) continue;

      const last = typeof t.lastAccessed === 'number' ? t.lastAccessed : 0;
      const age = now - last;

      if (age >= thresholdMs) {
        toClose.push(t.id);
      }
    }
  }

  if (toClose.length) {
    try {
      await chrome.tabs.remove(toClose);
      // Optional: console logging in service worker (visible in chrome://extensions background page)
      // console.log('Closed duplicate tabs:', toClose);
    } catch (e) {
      // some tabs may have disappeared or permissions could differ
    }
  }
}

function ensureAlarm(settings) {
  chrome.alarms.clear('sweep');
  chrome.alarms.create('sweep', { periodInMinutes: settings.sweepIntervalMinutes });
}

// --- Lifecycle & Events ---

chrome.runtime.onInstalled.addListener(async () => {
  const current = await getSettings();
  await setSettings(current); // ensures defaults are stored
  ensureAlarm(current);
});

chrome.runtime.onStartup.addListener(async () => {
  const current = await getSettings();
  ensureAlarm(current);
  // Run one sweep shortly after startup
  setTimeout(sweepDuplicates, 8000);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sweep') {
    sweepDuplicates();
  }
});

// If options change, re-schedule alarm
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[SETTINGS_KEY]) {
    getSettings().then(ensureAlarm);
  }
});