/**
 * chrome.storage.local helpers.
 * All reads and writes go through these functions.
 * Never store state in memory — always persist immediately.
 */

const DEFAULT_SETTINGS = {
  dailyTarget: 5,
  blendRatio: 0.6, // 60% reviews, 40% new
};

// ─── Low-level helpers ────────────────────────────────────────────────────────

export function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, result => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(result);
    });
  });
}

export function storageSet(items) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });
}

export function storageRemove(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(keys, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings() {
  const { settings } = await storageGet('settings');
  return { ...DEFAULT_SETTINGS, ...(settings || {}) };
}

export async function saveSettings(settings) {
  const current = await getSettings();
  await storageSet({ settings: { ...current, ...settings } });
}

// ─── Problems ─────────────────────────────────────────────────────────────────

/** Returns the full problems map: { [titleSlug]: problemData } */
export async function getProblems() {
  const { problems } = await storageGet('problems');
  return problems || {};
}

/** Save the entire problems map. */
export async function saveProblems(problems) {
  await storageSet({ problems });
}

/** Get a single problem by slug. */
export async function getProblem(titleSlug) {
  const problems = await getProblems();
  return problems[titleSlug] || null;
}

/** Update a single problem (partial merge). */
export async function updateProblem(titleSlug, updates) {
  const problems = await getProblems();
  problems[titleSlug] = { ...(problems[titleSlug] || {}), ...updates };
  await saveProblems(problems);
  return problems[titleSlug];
}

/** Add a review history entry to a problem. */
export async function addReviewHistory(titleSlug, date, rating) {
  const problems = await getProblems();
  const problem = problems[titleSlug];
  if (!problem) throw new Error(`Problem not found: ${titleSlug}`);

  problem.history = problem.history || [];
  problem.history.push({ date, rating });
  await saveProblems(problems);
}

// ─── Last active date ─────────────────────────────────────────────────────────

export async function getLastActiveDate() {
  const { lastActiveDate } = await storageGet('lastActiveDate');
  return lastActiveDate || null;
}

export async function setLastActiveDate(dateStr) {
  await storageSet({ lastActiveDate: dateStr });
}

// ─── Onboarding state ─────────────────────────────────────────────────────────

export async function isOnboarded() {
  const { onboarded } = await storageGet('onboarded');
  return !!onboarded;
}

export async function setOnboarded(value = true) {
  await storageSet({ onboarded: value });
}

export async function getOnboardingProgress() {
  const { onboardingProgress } = await storageGet('onboardingProgress');
  return onboardingProgress || { step: 'idle', offset: 0, totalFetched: 0 };
}

export async function setOnboardingProgress(progress) {
  await storageSet({ onboardingProgress: progress });
}

// ─── Daily session ────────────────────────────────────────────────────────────

/**
 * Get today's daily session.
 * { date, completed: [titleSlug...], queue: [titleSlug...] }
 */
export async function getDailySession() {
  const { dailySession } = await storageGet('dailySession');
  return dailySession || null;
}

export async function saveDailySession(session) {
  await storageSet({ dailySession: session });
}

/** Mark a problem as completed in today's session. */
export async function markCompleted(titleSlug) {
  const session = await getDailySession();
  if (!session) return;

  if (!session.completed.includes(titleSlug)) {
    session.completed.push(titleSlug);
  }
  await saveDailySession(session);
}

// ─── Username ─────────────────────────────────────────────────────────────────

export async function getUsername() {
  const { username } = await storageGet('username');
  return username || null;
}

export async function setUsername(username) {
  await storageSet({ username });
}
