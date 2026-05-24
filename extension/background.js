/**
 * LeetRepeat Service Worker (MV3)
 * Handles alarms and message routing.
 * NO persistent state in memory — everything lives in chrome.storage.local.
 */

// ─── Install / Update ─────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    // Set up daily alarm for date shift check
    chrome.alarms.create('dailyCheck', {
      when: nextMidnight(),
      periodInMinutes: 24 * 60,
    });
    console.log('[LeetRepeat] Extension installed, alarm set');
  }
});

// ─── Alarms ───────────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyCheck') {
    // Update lastActiveDate — the popup handles missed day logic on open
    // Just ensure the alarm fires to keep service worker alive
    console.log('[LeetRepeat] Daily alarm fired');
  }
});

// ─── Message routing ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(err => {
    console.error('[LeetRepeat] Message error:', err);
    sendResponse({ error: err.message });
  });
  return true; // async response
});

async function handleMessage(message, sender) {
  const { type, payload } = message;

  switch (type) {
    case 'PING':
      return { pong: true };

    case 'GET_STORAGE': {
      const { keys } = payload;
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, result => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(result);
        });
      });
    }

    case 'SET_STORAGE': {
      const { items } = payload;
      return new Promise((resolve, reject) => {
        chrome.storage.local.set(items, () => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve({ ok: true });
        });
      });
    }

    // Content script asks background to do the onboarding fetch
    // (content script can fetch directly but background can too)
    case 'ONBOARDING_COMPLETE':
      console.log('[LeetRepeat] Onboarding complete, username:', payload.username);
      return { ok: true };

    default:
      return { error: `Unknown message type: ${type}` };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nextMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}
