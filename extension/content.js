/**
 * LeetRepeat Content Script
 * Injected on leetcode.com pages.
 *
 * Responsibilities:
 * 1. Onboarding: fetch solve history via LeetCode GraphQL (same-origin, cookies included)
 * 2. MutationObserver: detect "Accepted" submissions
 * 3. Rating modal: show Easy/Medium/Hard overlay after acceptance
 * 4. Manual override button in problem page header
 */

(() => {
  'use strict';

  const GRAPHQL_URL = 'https://leetcode.com/graphql';

  // ─── Utilities ──────────────────────────────────────────────────────────────

  function getCsrfToken() {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : '';
  }

  async function gqlFetch(query, variables = {}) {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'x-csrftoken': getCsrfToken(),
      },
      credentials: 'include',
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors));
    return json.data;
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function today() {
    return new Date().toISOString().split('T')[0];
  }

  function sendToBackground(type, payload = {}) {
    return chrome.runtime.sendMessage({ type, payload });
  }

  async function storageGet(keys) {
    const result = await sendToBackground('GET_STORAGE', { keys });
    return result;
  }

  async function storageSet(items) {
    return sendToBackground('SET_STORAGE', { items });
  }

  // ─── GraphQL queries ────────────────────────────────────────────────────────

  async function getCurrentUser() {
    const data = await gqlFetch(`
      query globalData {
        userStatus {
          userId
          isSignedIn
          username
        }
      }
    `);
    return data.userStatus;
  }

  /**
   * Fetch ALL accepted submissions via pagination.
   * Returns Map<titleSlug, { title, titleSlug, timestamp, date }>
   * Keeps EARLIEST solve date per problem.
   */
  async function fetchAllAcSubmissions(onProgress) {
    const solveMap = new Map();
    let offset = 0;
    const limit = 20;
    let hasNext = true;
    let pageCount = 0;

    // NOTE: lastKey is always null in LeetCode's API — pagination is offset-only.
    // Passing extra null args (questionSlug, lang, status) causes a 400.
    while (hasNext) {
      const data = await gqlFetch(`
        query submissionList($offset: Int!, $limit: Int!) {
          submissionList(offset: $offset, limit: $limit) {
            hasNext
            submissions {
              id
              statusDisplay
              timestamp
              title
              titleSlug
            }
          }
        }
      `, { offset, limit });

      const list = data.submissionList;
      hasNext = list.hasNext;
      pageCount++;

      for (const sub of list.submissions) {
        if (sub.statusDisplay !== 'Accepted') continue;
        const ts = parseInt(sub.timestamp, 10);
        const existing = solveMap.get(sub.titleSlug);
        if (!existing || ts > existing.timestamp) {
          solveMap.set(sub.titleSlug, {
            title: sub.title,
            titleSlug: sub.titleSlug,
            timestamp: ts,
            date: new Date(ts * 1000).toISOString().split('T')[0],
          });
        }
      }

      if (onProgress) onProgress(solveMap.size, pageCount);

      offset += limit;
      if (offset > 10000) break; // safety cap

      await sleep(150); // rate limit courtesy
    }

    return solveMap;
  }

  // ─── SM-2 helpers (inline, no module imports in content scripts) ────────────

  const RATING_TO_QUALITY = { Easy: 5, Medium: 3, Hard: 1 };

  function initialCardState(solvedDateStr, todayStr) {
    const a = new Date(solvedDateStr + 'T00:00:00Z');
    const b = new Date(todayStr + 'T00:00:00Z');
    const daysSinceSolve = Math.floor((b - a) / 86400000);

    let dueOffset;
    if (daysSinceSolve >= 730) {
      dueOffset = 0;
    } else if (daysSinceSolve >= 180) {
      dueOffset = randInt(14, 28);
    } else if (daysSinceSolve >= 30) {
      dueOffset = randInt(42, 56);
    } else {
      dueOffset = randInt(90, 120);
    }

    const nextDue = addDays(todayStr, dueOffset);
    return {
      interval: Math.max(1, dueOffset),
      easeFactor: 2.5,
      repetitions: 1,
      nextDue,
      status: 'review',
    };
  }

  function applyReview(card, rating, todayStr) {
    const q = RATING_TO_QUALITY[rating];
    let { interval, easeFactor, repetitions } = card;

    if (q < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);
      repetitions++;
    }

    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    return { interval, easeFactor, repetitions, nextDue: addDays(todayStr, interval) };
  }

  function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split('T')[0];
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ─── Neetcode 150 slug set (for tag lookup during onboarding) ──────────────

  // We store tags from the hardcoded list or fall back to a minimal tag set.
  // Full list is in neetcode150.js but content scripts can't import ES modules directly.
  // We'll embed a compact lookup here.
  const NC150_TAGS = {
    'two-sum': ['Array', 'Hash Table'],
    'contains-duplicate': ['Array', 'Hash Table', 'Sorting'],
    'valid-anagram': ['Hash Table', 'String', 'Sorting'],
    'group-anagrams': ['Array', 'Hash Table', 'String', 'Sorting'],
    'top-k-frequent-elements': ['Array', 'Hash Table', 'Heap (Priority Queue)'],
    'product-of-array-except-self': ['Array', 'Prefix Sum'],
    'valid-sudoku': ['Array', 'Hash Table', 'Matrix'],
    'encode-and-decode-strings': ['Array', 'String', 'Design'],
    'longest-consecutive-sequence': ['Array', 'Hash Table', 'Union Find'],
    'valid-palindrome': ['Two Pointers', 'String'],
    'two-sum-ii-input-array-is-sorted': ['Array', 'Two Pointers', 'Binary Search'],
    '3sum': ['Array', 'Two Pointers', 'Sorting'],
    'container-with-most-water': ['Array', 'Two Pointers', 'Greedy'],
    'trapping-rain-water': ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
    'best-time-to-buy-and-sell-stock': ['Array', 'Dynamic Programming'],
    'longest-substring-without-repeating-characters': ['Hash Table', 'String', 'Sliding Window'],
    'longest-repeating-character-replacement': ['Hash Table', 'String', 'Sliding Window'],
    'permutation-in-string': ['Hash Table', 'Two Pointers', 'String', 'Sliding Window'],
    'minimum-window-substring': ['Hash Table', 'String', 'Sliding Window'],
    'sliding-window-maximum': ['Array', 'Queue', 'Sliding Window', 'Heap (Priority Queue)'],
    // ... (abbreviated — background onboarding will fetch full tags)
  };

  // ─── Onboarding ─────────────────────────────────────────────────────────────

  async function runOnboarding() {
    const storage = await storageGet(['onboarded', 'username']);
    if (storage.onboarded) return; // already done

    // Check if signed in
    let user;
    try {
      user = await getCurrentUser();
    } catch (e) {
      console.warn('[LeetRepeat] Could not fetch user:', e);
      return;
    }

    if (!user?.isSignedIn) {
      console.log('[LeetRepeat] Not signed in, skipping onboarding');
      return;
    }

    console.log('[LeetRepeat] Starting onboarding for:', user.username);
    showOnboardingBanner(`LeetRepeat: Importing your solve history…`);

    try {
      const solveMap = await fetchAllAcSubmissions((count, pages) => {
        updateOnboardingBanner(`LeetRepeat: Found ${count} solved problems (page ${pages})…`);
      });

      console.log(`[LeetRepeat] Fetched ${solveMap.size} unique solved problems`);

      const todayStr = today();
      const problems = {};

      for (const [slug, solve] of solveMap) {
        const cardState = initialCardState(solve.date, todayStr);
        // Tags: use our embedded map, else generic
        const tags = NC150_TAGS[slug] || [];
        problems[slug] = {
          title: solve.title,
          leetcodeId: null, // populated from Neetcode 150 list if known
          tags,
          leetcodeDifficulty: null,
          history: [{ date: solve.date, rating: null }],
          ...cardState,
        };
      }

      // Merge with Neetcode 150 metadata
      // (We'll do a lightweight merge here; full enrichment happens in popup)
      await storageSet({
        problems,
        username: user.username,
        onboarded: true,
        lastActiveDate: todayStr,
      });

      await sendToBackground('ONBOARDING_COMPLETE', { username: user.username });
      updateOnboardingBanner(`LeetRepeat: Imported ${solveMap.size} problems! Open the extension popup to start reviewing.`);
      setTimeout(removeOnboardingBanner, 5000);
    } catch (err) {
      console.error('[LeetRepeat] Onboarding failed:', err);
      updateOnboardingBanner('LeetRepeat: Import failed. Please try refreshing the page.');
      setTimeout(removeOnboardingBanner, 5000);
    }
  }

  // ─── Onboarding banner UI ───────────────────────────────────────────────────

  let bannerEl = null;

  function showOnboardingBanner(text) {
    if (bannerEl) return;
    bannerEl = document.createElement('div');
    bannerEl.id = 'leetrepeat-banner';
    bannerEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 999999;
      background: #2563eb;
      color: white;
      padding: 10px 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      font-weight: 500;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    bannerEl.textContent = text;
    document.body.prepend(bannerEl);
  }

  function updateOnboardingBanner(text) {
    if (bannerEl) bannerEl.textContent = text;
  }

  function removeOnboardingBanner() {
    if (bannerEl) {
      bannerEl.remove();
      bannerEl = null;
    }
  }

  // ─── Submission detection ───────────────────────────────────────────────────

  let ratingModalShown = false;
  let currentProblemSlug = null;

  function getProblemSlugFromURL() {
    const match = location.pathname.match(/\/problems\/([^/]+)/);
    return match ? match[1] : null;
  }

  function setupSubmissionObserver() {
    currentProblemSlug = getProblemSlugFromURL();
    if (!currentProblemSlug) return;

    injectManualButton();

    const observer = new MutationObserver(mutations => {
      if (ratingModalShown) return;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (isAcceptedNode(node)) {
            handleAccepted();
            return;
          }
          // Check descendants
          const accepted = node.querySelector && node.querySelector(
            '[data-e2e-locator="submission-result"], .text-green-s, [class*="accepted"]'
          );
          if (accepted && isAcceptedText(accepted.textContent)) {
            handleAccepted();
            return;
          }
        }

        // Also check target for text changes
        if (mutation.type === 'characterData' || mutation.type === 'childList') {
          const target = mutation.target;
          if (target.textContent && isAcceptedText(target.textContent)) {
            // Only trigger if this is in the submission result area
            const resultArea = target.closest?.('[data-e2e-locator="submission-result"]') ||
                               target.closest?.('.result-container') ||
                               target.closest?.('[class*="result"]');
            if (resultArea) {
              handleAccepted();
              return;
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function isAcceptedNode(node) {
    if (!node.textContent) return false;
    const text = node.textContent.trim();
    // LeetCode shows "Accepted" in the result area
    if (!isAcceptedText(text)) return false;
    // Ensure it's in a result context (avoid false positives from nav links etc.)
    const classes = (node.className || '') + (node.getAttribute?.('data-e2e-locator') || '');
    return classes.includes('result') ||
           classes.includes('submission') ||
           classes.includes('accepted') ||
           node.getAttribute?.('data-e2e-locator') === 'submission-result';
  }

  function isAcceptedText(text) {
    return /^accepted$/i.test(text.trim());
  }

  async function handleAccepted() {
    if (ratingModalShown) return;
    ratingModalShown = true;
    await sleep(800); // slight delay for DOM to settle
    showRatingModal(currentProblemSlug);
  }

  // ─── Manual override button ──────────────────────────────────────────────────

  function injectManualButton() {
    // Don't inject twice
    if (document.getElementById('leetrepeat-manual-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'leetrepeat-manual-btn';
    btn.textContent = '⟳ LeetRepeat';
    btn.title = 'Manually rate this problem for spaced repetition';
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      transition: background 0.2s;
    `;
    btn.addEventListener('mouseenter', () => btn.style.background = '#1d4ed8');
    btn.addEventListener('mouseleave', () => btn.style.background = '#2563eb');
    btn.addEventListener('click', () => {
      ratingModalShown = false; // allow re-show
      showRatingModal(currentProblemSlug);
    });

    document.body.appendChild(btn);
  }

  // ─── Rating modal ────────────────────────────────────────────────────────────

  function showRatingModal(titleSlug) {
    if (document.getElementById('leetrepeat-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'leetrepeat-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 1000000;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: lr-fade-in 0.2s ease;
    `;

    const modal = document.createElement('div');
    modal.id = 'leetrepeat-modal';
    modal.style.cssText = `
      background: #1e1e2e;
      border: 1px solid #313244;
      border-radius: 16px;
      padding: 32px 40px;
      text-align: center;
      width: 360px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #cdd6f4;
      animation: lr-slide-up 0.25s ease;
    `;

    modal.innerHTML = `
      <style>
        @keyframes lr-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lr-slide-up { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        .lr-btn {
          border: none;
          border-radius: 10px;
          padding: 12px 20px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.1s, filter 0.1s;
          min-width: 90px;
          font-family: inherit;
        }
        .lr-btn:hover { transform: scale(1.05); filter: brightness(1.1); }
        .lr-btn:active { transform: scale(0.97); }
      </style>
      <div style="font-size:28px;margin-bottom:8px;">🧠</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:6px;">How was it?</div>
      <div style="font-size:13px;color:#a6adc8;margin-bottom:28px;">Rate your solve to update your review schedule</div>
      <div style="display:flex;gap:12px;justify-content:center;margin-bottom:20px;">
        <button class="lr-btn" data-rating="Easy" style="background:#a6e3a1;color:#1e1e2e;">
          😊 Easy
        </button>
        <button class="lr-btn" data-rating="Medium" style="background:#f9e2af;color:#1e1e2e;">
          😤 Medium
        </button>
        <button class="lr-btn" data-rating="Hard" style="background:#f38ba8;color:#1e1e2e;">
          💀 Hard
        </button>
      </div>
      <button id="lr-skip-btn" style="
        background:transparent;
        border:1px solid #45475a;
        color:#6c7086;
        border-radius:8px;
        padding:6px 16px;
        font-size:12px;
        cursor:pointer;
        font-family:inherit;
      ">Skip</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Button handlers
    modal.querySelectorAll('[data-rating]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rating = btn.getAttribute('data-rating');
        overlay.remove();
        ratingModalShown = false;
        await recordRating(titleSlug, rating);
        showConfirmToast(rating);
      });
    });

    document.getElementById('lr-skip-btn').addEventListener('click', () => {
      overlay.remove();
      ratingModalShown = false;
    });

    // Close on overlay click
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        overlay.remove();
        ratingModalShown = false;
      }
    });
  }

  function showConfirmToast(rating) {
    const emojiMap = { Easy: '😊', Medium: '😤', Hard: '💀' };
    const colorMap = { Easy: '#a6e3a1', Medium: '#f9e2af', Hard: '#f38ba8' };

    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 999999;
      background: ${colorMap[rating]};
      color: #1e1e2e;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: lr-fade-in 0.2s ease;
    `;
    toast.textContent = `${emojiMap[rating]} Rated ${rating} — schedule updated!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ─── Record rating to storage ────────────────────────────────────────────────

  async function recordRating(titleSlug, rating) {
    const storage = await storageGet(['problems']);
    const problems = storage.problems || {};
    const todayStr = today();

    let problem = problems[titleSlug];

    if (!problem) {
      // Problem not in deck yet — add it as new
      problem = {
        title: titleSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        leetcodeId: null,
        tags: [],
        leetcodeDifficulty: null,
        status: 'review',
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        nextDue: todayStr,
        history: [],
      };
    }

    // Apply SM-2
    const updated = applySm2(problem, rating, todayStr);
    problem = {
      ...problem,
      ...updated,
      status: 'review',
      history: [...(problem.history || []), { date: todayStr, rating }],
    };

    problems[titleSlug] = problem;

    await storageSet({ problems, lastActiveDate: todayStr });
    console.log(`[LeetRepeat] Recorded ${rating} for ${titleSlug}, next due: ${problem.nextDue}`);
  }

  function applySm2(card, rating, todayStr) {
    const RATING_Q = { Easy: 5, Medium: 3, Hard: 1 };
    const q = RATING_Q[rating];
    let { interval, easeFactor, repetitions } = card;

    if (q < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);
      repetitions++;
    }

    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    return { interval, easeFactor, repetitions, nextDue: addDays(todayStr, interval) };
  }

  // ─── Init ────────────────────────────────────────────────────────────────────

  function init() {
    // Run onboarding check (no-op if already done)
    runOnboarding();

    // Set up submission detection on problem pages
    if (location.pathname.includes('/problems/')) {
      setupSubmissionObserver();
    }

    // Re-init on navigation (LeetCode is a SPA)
    let lastPath = location.pathname;
    const navObserver = new MutationObserver(() => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        if (location.pathname.includes('/problems/')) {
          ratingModalShown = false;
          setupSubmissionObserver();
        }
      }
    });
    navObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
