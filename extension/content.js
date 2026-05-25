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

    // Stagger initial due dates so the review queue ramps up naturally
    // over the first ~30 days rather than arriving all at once.
    // Older solves (more likely forgotten) come due first.
    let dueOffset;
    if (daysSinceSolve >= 730) {
      dueOffset = randInt(0, 3);    // 2+ years ago → due within 3 days
    } else if (daysSinceSolve >= 180) {
      dueOffset = randInt(0, 7);    // 6 mo – 2 yr → due within a week
    } else if (daysSinceSolve >= 90) {
      dueOffset = randInt(3, 14);   // 3–6 months → due within 2 weeks
    } else if (daysSinceSolve >= 30) {
      dueOffset = randInt(7, 21);   // 1–3 months → due within 3 weeks
    } else {
      dueOffset = randInt(14, 30);  // last month → due within a month
    }

    const nextDue = addDays(todayStr, dueOffset);
    return {
      interval: Math.max(1, dueOffset || 1),
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

  // ─── Neetcode 150 tag lookup (complete — all 150 problems) ─────────────────
  // Mirrors utils/neetcode150.js; duplicated here because content scripts
  // cannot use ES module imports without a bundler.

  const NC150_TAGS = {
    // Arrays & Hashing
    'contains-duplicate':['Array','Hash Table','Sorting'],
    'valid-anagram':['Hash Table','String','Sorting'],
    'two-sum':['Array','Hash Table'],
    'group-anagrams':['Array','Hash Table','String','Sorting'],
    'top-k-frequent-elements':['Array','Hash Table','Divide and Conquer','Sorting','Heap (Priority Queue)','Bucket Sort','Counting','Quickselect'],
    'product-of-array-except-self':['Array','Prefix Sum'],
    'valid-sudoku':['Array','Hash Table','Matrix'],
    'encode-and-decode-strings':['Array','String','Design'],
    'longest-consecutive-sequence':['Array','Hash Table','Union Find'],
    // Two Pointers
    'valid-palindrome':['Two Pointers','String'],
    'two-sum-ii-input-array-is-sorted':['Array','Two Pointers','Binary Search'],
    '3sum':['Array','Two Pointers','Sorting'],
    'container-with-most-water':['Array','Two Pointers','Greedy'],
    'trapping-rain-water':['Array','Two Pointers','Dynamic Programming','Stack','Monotonic Stack'],
    // Sliding Window
    'best-time-to-buy-and-sell-stock':['Array','Dynamic Programming'],
    'longest-substring-without-repeating-characters':['Hash Table','String','Sliding Window'],
    'longest-repeating-character-replacement':['Hash Table','String','Sliding Window'],
    'permutation-in-string':['Hash Table','Two Pointers','String','Sliding Window'],
    'minimum-window-substring':['Hash Table','String','Sliding Window'],
    'sliding-window-maximum':['Array','Queue','Sliding Window','Heap (Priority Queue)','Monotonic Queue'],
    // Stack
    'valid-parentheses':['String','Stack'],
    'min-stack':['Stack','Design'],
    'evaluate-reverse-polish-notation':['Array','Math','Stack'],
    'generate-parentheses':['String','Dynamic Programming','Backtracking'],
    'daily-temperatures':['Array','Stack','Monotonic Stack'],
    'car-fleet':['Array','Stack','Sorting','Monotonic Stack'],
    'largest-rectangle-in-histogram':['Array','Stack','Monotonic Stack'],
    // Binary Search
    'binary-search':['Array','Binary Search'],
    'search-a-2d-matrix':['Array','Binary Search','Matrix'],
    'koko-eating-bananas':['Array','Binary Search'],
    'find-minimum-in-rotated-sorted-array':['Array','Binary Search'],
    'search-in-rotated-sorted-array':['Array','Binary Search'],
    'time-based-key-value-store':['Hash Table','String','Binary Search','Design'],
    'median-of-two-sorted-arrays':['Array','Binary Search','Divide and Conquer'],
    // Linked List
    'reverse-linked-list':['Linked List','Recursion'],
    'merge-two-sorted-lists':['Linked List','Recursion'],
    'reorder-list':['Linked List','Two Pointers','Stack','Recursion'],
    'remove-nth-node-from-end-of-list':['Linked List','Two Pointers'],
    'copy-list-with-random-pointer':['Hash Table','Linked List'],
    'add-two-numbers':['Linked List','Math','Recursion'],
    'linked-list-cycle':['Hash Table','Linked List','Two Pointers'],
    'find-the-duplicate-number':['Array','Two Pointers','Binary Search','Bit Manipulation'],
    'lru-cache':['Hash Table','Linked List','Design','Doubly-Linked List'],
    'merge-k-sorted-lists':['Linked List','Divide and Conquer','Heap (Priority Queue)','Merge Sort'],
    'reverse-nodes-in-k-group':['Linked List','Recursion'],
    // Trees
    'invert-binary-tree':['Tree','Depth-First Search','Breadth-First Search','Binary Tree'],
    'maximum-depth-of-binary-tree':['Tree','Depth-First Search','Breadth-First Search','Binary Tree'],
    'diameter-of-binary-tree':['Tree','Depth-First Search','Binary Tree'],
    'balanced-binary-tree':['Tree','Depth-First Search','Binary Tree'],
    'same-tree':['Tree','Depth-First Search','Breadth-First Search','Binary Tree'],
    'subtree-of-another-tree':['Tree','Depth-First Search','String Matching','Binary Tree','Hash Function'],
    'lowest-common-ancestor-of-a-binary-search-tree':['Tree','Depth-First Search','Binary Search Tree','Binary Tree'],
    'binary-tree-level-order-traversal':['Tree','Breadth-First Search','Binary Tree'],
    'binary-tree-right-side-view':['Tree','Depth-First Search','Breadth-First Search','Binary Tree'],
    'count-good-nodes-in-binary-tree':['Tree','Depth-First Search','Breadth-First Search','Binary Tree'],
    'validate-binary-search-tree':['Tree','Depth-First Search','Binary Search Tree','Binary Tree'],
    'kth-smallest-element-in-a-bst':['Tree','Depth-First Search','Binary Search Tree','Binary Tree'],
    'construct-binary-tree-from-preorder-and-inorder-traversal':['Array','Hash Table','Divide and Conquer','Tree','Binary Tree'],
    'binary-tree-maximum-path-sum':['Dynamic Programming','Tree','Depth-First Search','Binary Tree'],
    'serialize-and-deserialize-binary-tree':['String','Tree','Depth-First Search','Breadth-First Search','Design','Binary Tree'],
    // Tries
    'implement-trie-prefix-tree':['Hash Table','String','Design','Trie'],
    'design-add-and-search-words-data-structure':['String','Depth-First Search','Design','Trie'],
    'word-search-ii':['Array','String','Backtracking','Trie','Matrix'],
    // Heap
    'kth-largest-element-in-a-stream':['Tree','Design','Binary Search Tree','Heap (Priority Queue)','Binary Tree','Data Stream'],
    'last-stone-weight':['Array','Heap (Priority Queue)'],
    'k-closest-points-to-origin':['Array','Math','Divide and Conquer','Geometry','Sorting','Heap (Priority Queue)','Quickselect'],
    'kth-largest-element-in-an-array':['Array','Divide and Conquer','Sorting','Heap (Priority Queue)','Quickselect'],
    'task-scheduler':['Array','Hash Table','Greedy','Sorting','Heap (Priority Queue)','Counting'],
    'design-twitter':['Hash Table','Linked List','Design','Heap (Priority Queue)'],
    'find-median-from-data-stream':['Two Pointers','Design','Sorting','Heap (Priority Queue)','Data Stream'],
    // Backtracking
    'subsets':['Array','Backtracking','Bit Manipulation'],
    'combination-sum':['Array','Backtracking'],
    'permutations':['Array','Backtracking'],
    'subsets-ii':['Array','Backtracking','Bit Manipulation'],
    'combination-sum-ii':['Array','Backtracking'],
    'word-search':['Array','Backtracking','Matrix'],
    'palindrome-partitioning':['String','Dynamic Programming','Backtracking'],
    'letter-combinations-of-a-phone-number':['Hash Table','String','Backtracking'],
    'n-queens':['Array','Backtracking'],
    // Graphs
    'number-of-islands':['Array','Depth-First Search','Breadth-First Search','Union Find','Matrix'],
    'clone-graph':['Hash Table','Depth-First Search','Breadth-First Search','Graph'],
    'max-area-of-island':['Array','Depth-First Search','Breadth-First Search','Union Find','Matrix'],
    'pacific-atlantic-water-flow':['Array','Depth-First Search','Breadth-First Search','Matrix'],
    'surrounded-regions':['Array','Depth-First Search','Breadth-First Search','Union Find','Matrix'],
    'rotting-oranges':['Array','Breadth-First Search','Matrix'],
    'walls-and-gates':['Array','Breadth-First Search','Matrix'],
    'course-schedule':['Depth-First Search','Breadth-First Search','Graph','Topological Sort'],
    'course-schedule-ii':['Depth-First Search','Breadth-First Search','Graph','Topological Sort'],
    'redundant-connection':['Depth-First Search','Breadth-First Search','Union Find','Graph'],
    'number-of-connected-components-in-an-undirected-graph':['Depth-First Search','Breadth-First Search','Union Find','Graph'],
    'graph-valid-tree':['Depth-First Search','Breadth-First Search','Union Find','Graph'],
    'word-ladder':['Hash Table','String','Breadth-First Search'],
    // Advanced Graphs
    'reconstruct-itinerary':['Depth-First Search','Graph','Eulerian Circuit'],
    'min-cost-to-connect-all-points':['Array','Union Find','Graph','Minimum Spanning Tree'],
    'network-delay-time':['Depth-First Search','Breadth-First Search','Graph','Heap (Priority Queue)','Shortest Path'],
    'swim-in-rising-water':['Array','Binary Search','Depth-First Search','Breadth-First Search','Union Find','Heap (Priority Queue)','Matrix'],
    'alien-dictionary':['Array','String','Depth-First Search','Breadth-First Search','Graph','Topological Sort'],
    'cheapest-flights-within-k-stops':['Dynamic Programming','Depth-First Search','Breadth-First Search','Graph','Heap (Priority Queue)','Shortest Path'],
    // 1-D DP
    'climbing-stairs':['Math','Dynamic Programming','Memoization'],
    'min-cost-climbing-stairs':['Array','Dynamic Programming'],
    'house-robber':['Array','Dynamic Programming'],
    'house-robber-ii':['Array','Dynamic Programming'],
    'longest-palindromic-substring':['Two Pointers','String','Dynamic Programming'],
    'palindromic-substrings':['Two Pointers','String','Dynamic Programming'],
    'decode-ways':['String','Dynamic Programming'],
    'coin-change':['Array','Dynamic Programming','Breadth-First Search'],
    'maximum-product-subarray':['Array','Dynamic Programming'],
    'word-break':['Array','Hash Table','String','Dynamic Programming','Trie','Memoization'],
    'longest-increasing-subsequence':['Array','Binary Search','Dynamic Programming'],
    'partition-equal-subset-sum':['Array','Dynamic Programming'],
    // 2-D DP
    'unique-paths':['Math','Dynamic Programming','Combinatorics'],
    'longest-common-subsequence':['String','Dynamic Programming'],
    'best-time-to-buy-and-sell-stock-with-cooldown':['Array','Dynamic Programming'],
    'coin-change-ii':['Array','Dynamic Programming'],
    'target-sum':['Array','Dynamic Programming','Backtracking'],
    'interleaving-string':['String','Dynamic Programming'],
    'longest-increasing-path-in-a-matrix':['Array','Dynamic Programming','Depth-First Search','Breadth-First Search','Graph','Topological Sort','Memoization','Matrix'],
    'distinct-subsequences':['String','Dynamic Programming'],
    'edit-distance':['String','Dynamic Programming'],
    'burst-balloons':['Array','Dynamic Programming'],
    'regular-expression-matching':['String','Dynamic Programming','Recursion'],
    // Greedy
    'maximum-subarray':['Array','Divide and Conquer','Dynamic Programming'],
    'jump-game':['Array','Dynamic Programming','Greedy'],
    'jump-game-ii':['Array','Dynamic Programming','Greedy'],
    'gas-station':['Array','Greedy'],
    'hand-of-straights':['Array','Hash Table','Greedy','Sorting'],
    'merge-triplets-to-form-target-triplet':['Array','Greedy'],
    'partition-labels':['Hash Table','Two Pointers','String','Greedy'],
    'valid-parenthesis-string':['String','Dynamic Programming','Stack','Greedy'],
    // Intervals
    'insert-interval':['Array'],
    'merge-intervals':['Array','Sorting'],
    'non-overlapping-intervals':['Array','Dynamic Programming','Greedy','Sorting'],
    'meeting-rooms':['Array','Sorting'],
    'meeting-rooms-ii':['Array','Two Pointers','Greedy','Sorting','Heap (Priority Queue)','Prefix Sum'],
    'minimum-interval-to-include-each-query':['Array','Binary Search','Line Sweep','Sorting','Heap (Priority Queue)'],
    // Math & Geometry
    'rotate-image':['Array','Math','Matrix'],
    'spiral-matrix':['Array','Matrix','Simulation'],
    'set-matrix-zeroes':['Array','Hash Table','Matrix'],
    'happy-number':['Hash Table','Math','Two Pointers'],
    'plus-one':['Array','Math'],
    'pow-x-n':['Math','Recursion'],
    'multiply-strings':['Math','String','Simulation'],
    'detect-squares':['Array','Hash Table','Design','Counting'],
    // Bit Manipulation
    'single-number':['Array','Bit Manipulation'],
    'number-of-1-bits':['Divide and Conquer','Bit Manipulation'],
    'counting-bits':['Dynamic Programming','Bit Manipulation'],
    'reverse-bits':['Divide and Conquer','Bit Manipulation'],
    'missing-number':['Array','Hash Table','Math','Binary Search','Bit Manipulation','Sorting'],
    'sum-of-two-integers':['Math','Bit Manipulation'],
    'reverse-integer':['Math'],
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
