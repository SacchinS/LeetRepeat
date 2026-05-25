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
    if (document.getElementById('leetrepeat-manual-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'leetrepeat-manual-btn';
    btn.title = 'Auto-detection missed your solve? Rate it manually.';

    // Lucide pencil-line icon
    const pencilSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;

    btn.innerHTML = `${pencilSvg} Rate solve`;
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 6px;
      background: #131621;
      color: #8890b5;
      border: 1px solid #252840;
      border-radius: 8px;
      padding: 7px 13px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
      letter-spacing: 0.01em;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.borderColor = '#6b8cfa';
      btn.style.color = '#6b8cfa';
      btn.style.background = 'rgba(107,140,250,0.08)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.borderColor = '#252840';
      btn.style.color = '#8890b5';
      btn.style.background = '#131621';
    });
    btn.addEventListener('click', () => {
      ratingModalShown = false;
      showRatingModal(currentProblemSlug, /* isManual */ true);
    });

    document.body.appendChild(btn);
  }

  // ─── Rating modal ─────────────────────────────────────────────────────────────
  // isManual = true when triggered by the "Rate solve" button (not auto-detected)

  function showRatingModal(titleSlug, isManual = false) {
    if (document.getElementById('leetrepeat-modal')) return;

    // ── Inline Lucide SVG helpers ───────────────────────────────────────────
    const svg = (paths, size = 16, color = 'currentColor') =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

    const ICONS = {
      repeat:    `<path d="m2 9 3-3 3 3"/><path d="M13 18H7a2 2 0 0 1-2-2V6"/><path d="m22 15-3 3-3-3"/><path d="M11 6h6a2 2 0 0 1 2 2v10"/>`,
      check:     `<path d="M20 6 9 17l-5-5"/>`,
      minus:     `<path d="M5 12h14"/>`,
      xmark:     `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
      alertTri:  `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>`,
    };

    const overlay = document.createElement('div');
    overlay.id = 'leetrepeat-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 1000000;
      background: rgba(0,0,0,0.65);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(2px);
      animation: lr-fade 0.18s ease;
    `;

    const modal = document.createElement('div');
    modal.id = 'leetrepeat-modal';
    modal.style.cssText = `
      background: #0c0e17;
      border: 1px solid #252840;
      border-radius: 16px;
      padding: 28px 32px 24px;
      text-align: center;
      width: 340px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.6);
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #e6e9f4;
      animation: lr-up 0.22s cubic-bezier(0.34,1.56,0.64,1);
    `;

    // Manual override warning banner
    const warningBanner = isManual ? `
      <div style="
        display:inline-flex;
        align-items:center;
        gap:6px;
        background:rgba(251,146,60,0.10);
        border:1px solid rgba(251,146,60,0.25);
        border-radius:99px;
        padding:4px 12px 4px 8px;
        margin-bottom:18px;
        font-size:11px;
        font-weight:700;
        color:#fb923c;
        letter-spacing:0.04em;
        text-transform:uppercase;
      ">
        ${svg(ICONS.alertTri, 12, '#fb923c')} Manual override
      </div>
    ` : '';

    const titleText   = isManual ? 'Rate this problem' : 'How did that feel?';
    const subtitleText = isManual
      ? 'Only use this if you <strong>just solved it</strong> and auto-detection missed the submission.'
      : 'Your rating sets the next review date — be honest.';

    modal.innerHTML = `
      <style>
        @keyframes lr-fade { from { opacity:0 } to { opacity:1 } }
        @keyframes lr-up   { from { transform:translateY(16px) scale(0.97); opacity:0 } to { transform:none; opacity:1 } }

        .lr-rating-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          background: #131621;
          border: 1px solid #252840;
          border-radius: 12px;
          padding: 14px 10px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, transform 0.1s;
          flex: 1;
          font-family: inherit;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .lr-rating-btn:hover  { transform: translateY(-2px); }
        .lr-rating-btn:active { transform: scale(0.97); }

        .lr-rating-btn[data-rating="Easy"]   { color: #4ade94; }
        .lr-rating-btn[data-rating="Easy"]:hover   { border-color: #4ade94; background: rgba(74,222,148,0.08); }

        .lr-rating-btn[data-rating="Medium"] { color: #f5c542; }
        .lr-rating-btn[data-rating="Medium"]:hover { border-color: #f5c542; background: rgba(245,197,66,0.08); }

        .lr-rating-btn[data-rating="Hard"]   { color: #f47474; }
        .lr-rating-btn[data-rating="Hard"]:hover   { border-color: #f47474; background: rgba(244,116,116,0.08); }

        .lr-icon-wrap {
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lr-rating-btn[data-rating="Easy"]   .lr-icon-wrap { background: rgba(74,222,148,0.12); }
        .lr-rating-btn[data-rating="Medium"] .lr-icon-wrap { background: rgba(245,197,66,0.12); }
        .lr-rating-btn[data-rating="Hard"]   .lr-icon-wrap { background: rgba(244,116,116,0.12); }

        #lr-skip-btn {
          background: none;
          border: none;
          color: #4c5278;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          padding: 6px 12px;
          border-radius: 6px;
          transition: color 0.15s;
        }
        #lr-skip-btn:hover { color: #8890b5; }
      </style>

      ${warningBanner}

      <div style="
        width:40px; height:40px;
        background:rgba(107,140,250,0.10);
        border:1px solid rgba(107,140,250,0.20);
        border-radius:10px;
        display:flex;
        align-items:center;
        justify-content:center;
        color:#6b8cfa;
        margin:0 auto 14px;
      ">
        ${svg(ICONS.repeat, 20, '#6b8cfa')}
      </div>

      <div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;margin-bottom:6px;">
        ${titleText}
      </div>
      <div style="font-size:12.5px;color:#8890b5;line-height:1.55;margin-bottom:24px;">
        ${subtitleText}
      </div>

      <div style="display:flex;gap:8px;margin-bottom:18px;">
        <button class="lr-rating-btn" data-rating="Easy">
          <div class="lr-icon-wrap">${svg(ICONS.check, 18, '#4ade94')}</div>
          Easy
        </button>
        <button class="lr-rating-btn" data-rating="Medium">
          <div class="lr-icon-wrap">${svg(ICONS.minus, 18, '#f5c542')}</div>
          Medium
        </button>
        <button class="lr-rating-btn" data-rating="Hard">
          <div class="lr-icon-wrap">${svg(ICONS.xmark, 18, '#f47474')}</div>
          Hard
        </button>
      </div>

      <button id="lr-skip-btn">Skip for now</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

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

    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        overlay.remove();
        ratingModalShown = false;
      }
    });
  }

  function showConfirmToast(rating) {
    const svg = paths =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

    const config = {
      Easy:   { bg: 'rgba(74,222,148,0.12)',  border: 'rgba(74,222,148,0.25)',  color: '#4ade94', icon: svg('<path d="M20 6 9 17l-5-5"/>') },
      Medium: { bg: 'rgba(245,197,66,0.12)',  border: 'rgba(245,197,66,0.25)',  color: '#f5c542', icon: svg('<path d="M5 12h14"/>') },
      Hard:   { bg: 'rgba(244,116,116,0.12)', border: 'rgba(244,116,116,0.25)', color: '#f47474', icon: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>') },
    };
    const c = config[rating];

    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 60px;
      right: 20px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      background: ${c.bg};
      border: 1px solid ${c.border};
      color: ${c.color};
      padding: 9px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      animation: lr-fade 0.2s ease;
      letter-spacing: 0.01em;
    `;
    toast.innerHTML = `${c.icon} Rated <strong>${rating}</strong> — schedule updated`;
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

    // Mark as complete in today's popup session so the checklist reflects
    // the real submission — the popup checkbox is read-only and only updated here.
    const sessionData = await storageGet(['dailySession']);
    const session = sessionData.dailySession;
    if (session && session.date === todayStr) {
      if (!session.completed.includes(titleSlug)) {
        session.completed.push(titleSlug);
      }
      await storageSet({ dailySession: session });
    }

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
