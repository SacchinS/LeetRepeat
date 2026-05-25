'use strict';

// ─── Lucide icon helpers ──────────────────────────────────────────────────────
// Inline SVG paths from Lucide (MIT). Rendered via icon() throughout.

const ICON_PATHS = {
  'check':        '<path d="M20 6 9 17l-5-5"/>',
  'arrow-up-right':'<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  'clock':        '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
};

function icon(name, size = 13) {
  const paths = ICON_PATHS[name] ?? '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, r => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(r);
    });
  });
}

function storageSet(items) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().split('T')[0]; }

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

function daysBetween(a, b) {
  return Math.floor(
    (new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000
  );
}

// ─── SM-2 ─────────────────────────────────────────────────────────────────────

function applySm2(card, rating, todayStr) {
  const q = { Easy: 5, Medium: 3, Hard: 1 }[rating];
  let { interval, easeFactor, repetitions } = card;
  if (q < 3) { repetitions = 0; interval = 1; }
  else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  }
  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return { interval, easeFactor, repetitions, nextDue: addDays(todayStr, interval) };
}

// ─── Neetcode 150 ─────────────────────────────────────────────────────────────

const NC_ORDERED = [
  'contains-duplicate','valid-anagram','two-sum','group-anagrams',
  'top-k-frequent-elements','product-of-array-except-self','valid-sudoku',
  'encode-and-decode-strings','longest-consecutive-sequence',
  'valid-palindrome','two-sum-ii-input-array-is-sorted','3sum',
  'container-with-most-water','trapping-rain-water',
  'best-time-to-buy-and-sell-stock',
  'longest-substring-without-repeating-characters',
  'longest-repeating-character-replacement','permutation-in-string',
  'minimum-window-substring','sliding-window-maximum',
  'valid-parentheses','min-stack','evaluate-reverse-polish-notation',
  'generate-parentheses','daily-temperatures','car-fleet',
  'largest-rectangle-in-histogram','binary-search','search-a-2d-matrix',
  'koko-eating-bananas','find-minimum-in-rotated-sorted-array',
  'search-in-rotated-sorted-array','time-based-key-value-store',
  'median-of-two-sorted-arrays','reverse-linked-list','merge-two-sorted-lists',
  'reorder-list','remove-nth-node-from-end-of-list',
  'copy-list-with-random-pointer','add-two-numbers','linked-list-cycle',
  'find-the-duplicate-number','lru-cache','merge-k-sorted-lists',
  'reverse-nodes-in-k-group','invert-binary-tree',
  'maximum-depth-of-binary-tree','diameter-of-binary-tree',
  'balanced-binary-tree','same-tree','subtree-of-another-tree',
  'lowest-common-ancestor-of-a-binary-search-tree',
  'binary-tree-level-order-traversal','binary-tree-right-side-view',
  'count-good-nodes-in-binary-tree','validate-binary-search-tree',
  'kth-smallest-element-in-a-bst',
  'construct-binary-tree-from-preorder-and-inorder-traversal',
  'binary-tree-maximum-path-sum','serialize-and-deserialize-binary-tree',
  'implement-trie-prefix-tree',
  'design-add-and-search-words-data-structure','word-search-ii',
  'kth-largest-element-in-a-stream','last-stone-weight',
  'k-closest-points-to-origin','kth-largest-element-in-an-array',
  'task-scheduler','design-twitter','find-median-from-data-stream',
  'subsets','combination-sum','permutations','subsets-ii','combination-sum-ii',
  'word-search','palindrome-partitioning',
  'letter-combinations-of-a-phone-number','n-queens',
  'number-of-islands','clone-graph','max-area-of-island',
  'pacific-atlantic-water-flow','surrounded-regions','rotting-oranges',
  'walls-and-gates','course-schedule','course-schedule-ii',
  'redundant-connection',
  'number-of-connected-components-in-an-undirected-graph',
  'graph-valid-tree','word-ladder','reconstruct-itinerary',
  'min-cost-to-connect-all-points','network-delay-time','swim-in-rising-water',
  'alien-dictionary','cheapest-flights-within-k-stops',
  'climbing-stairs','min-cost-climbing-stairs','house-robber','house-robber-ii',
  'longest-palindromic-substring','palindromic-substrings','decode-ways',
  'coin-change','maximum-product-subarray','word-break',
  'longest-increasing-subsequence','partition-equal-subset-sum',
  'unique-paths','longest-common-subsequence',
  'best-time-to-buy-and-sell-stock-with-cooldown','coin-change-ii',
  'target-sum','interleaving-string','longest-increasing-path-in-a-matrix',
  'distinct-subsequences','edit-distance','burst-balloons',
  'regular-expression-matching','maximum-subarray','jump-game','jump-game-ii',
  'gas-station','hand-of-straights','merge-triplets-to-form-target-triplet',
  'partition-labels','valid-parenthesis-string','insert-interval',
  'merge-intervals','non-overlapping-intervals','meeting-rooms',
  'meeting-rooms-ii','minimum-interval-to-include-each-query',
  'rotate-image','spiral-matrix','set-matrix-zeroes','happy-number','plus-one',
  'pow-x-n','multiply-strings','detect-squares',
  'single-number','number-of-1-bits','counting-bits','reverse-bits',
  'missing-number','sum-of-two-integers','reverse-integer',
];

// Full slug → tags map (mirrors utils/neetcode150.js; duplicated here because
// popup scripts can't use ES module imports without a bundler)
const NC150_TAGS = {
  'contains-duplicate':['Array','Hash Table','Sorting'],
  'valid-anagram':['Hash Table','String','Sorting'],
  'two-sum':['Array','Hash Table'],
  'group-anagrams':['Array','Hash Table','String','Sorting'],
  'top-k-frequent-elements':['Array','Hash Table','Divide and Conquer','Sorting','Heap (Priority Queue)','Bucket Sort','Counting','Quickselect'],
  'product-of-array-except-self':['Array','Prefix Sum'],
  'valid-sudoku':['Array','Hash Table','Matrix'],
  'encode-and-decode-strings':['Array','String','Design'],
  'longest-consecutive-sequence':['Array','Hash Table','Union Find'],
  'valid-palindrome':['Two Pointers','String'],
  'two-sum-ii-input-array-is-sorted':['Array','Two Pointers','Binary Search'],
  '3sum':['Array','Two Pointers','Sorting'],
  'container-with-most-water':['Array','Two Pointers','Greedy'],
  'trapping-rain-water':['Array','Two Pointers','Dynamic Programming','Stack','Monotonic Stack'],
  'best-time-to-buy-and-sell-stock':['Array','Dynamic Programming'],
  'longest-substring-without-repeating-characters':['Hash Table','String','Sliding Window'],
  'longest-repeating-character-replacement':['Hash Table','String','Sliding Window'],
  'permutation-in-string':['Hash Table','Two Pointers','String','Sliding Window'],
  'minimum-window-substring':['Hash Table','String','Sliding Window'],
  'sliding-window-maximum':['Array','Queue','Sliding Window','Heap (Priority Queue)','Monotonic Queue'],
  'valid-parentheses':['String','Stack'],
  'min-stack':['Stack','Design'],
  'evaluate-reverse-polish-notation':['Array','Math','Stack'],
  'generate-parentheses':['String','Dynamic Programming','Backtracking'],
  'daily-temperatures':['Array','Stack','Monotonic Stack'],
  'car-fleet':['Array','Stack','Sorting','Monotonic Stack'],
  'largest-rectangle-in-histogram':['Array','Stack','Monotonic Stack'],
  'binary-search':['Array','Binary Search'],
  'search-a-2d-matrix':['Array','Binary Search','Matrix'],
  'koko-eating-bananas':['Array','Binary Search'],
  'find-minimum-in-rotated-sorted-array':['Array','Binary Search'],
  'search-in-rotated-sorted-array':['Array','Binary Search'],
  'time-based-key-value-store':['Hash Table','String','Binary Search','Design'],
  'median-of-two-sorted-arrays':['Array','Binary Search','Divide and Conquer'],
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
  'implement-trie-prefix-tree':['Hash Table','String','Design','Trie'],
  'design-add-and-search-words-data-structure':['String','Depth-First Search','Design','Trie'],
  'word-search-ii':['Array','String','Backtracking','Trie','Matrix'],
  'kth-largest-element-in-a-stream':['Tree','Design','Binary Search Tree','Heap (Priority Queue)','Binary Tree','Data Stream'],
  'last-stone-weight':['Array','Heap (Priority Queue)'],
  'k-closest-points-to-origin':['Array','Math','Divide and Conquer','Geometry','Sorting','Heap (Priority Queue)','Quickselect'],
  'kth-largest-element-in-an-array':['Array','Divide and Conquer','Sorting','Heap (Priority Queue)','Quickselect'],
  'task-scheduler':['Array','Hash Table','Greedy','Sorting','Heap (Priority Queue)','Counting'],
  'design-twitter':['Hash Table','Linked List','Design','Heap (Priority Queue)'],
  'find-median-from-data-stream':['Two Pointers','Design','Sorting','Heap (Priority Queue)','Data Stream'],
  'subsets':['Array','Backtracking','Bit Manipulation'],
  'combination-sum':['Array','Backtracking'],
  'permutations':['Array','Backtracking'],
  'subsets-ii':['Array','Backtracking','Bit Manipulation'],
  'combination-sum-ii':['Array','Backtracking'],
  'word-search':['Array','Backtracking','Matrix'],
  'palindrome-partitioning':['String','Dynamic Programming','Backtracking'],
  'letter-combinations-of-a-phone-number':['Hash Table','String','Backtracking'],
  'n-queens':['Array','Backtracking'],
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
  'reconstruct-itinerary':['Depth-First Search','Graph','Eulerian Circuit'],
  'min-cost-to-connect-all-points':['Array','Union Find','Graph','Minimum Spanning Tree'],
  'network-delay-time':['Depth-First Search','Breadth-First Search','Graph','Heap (Priority Queue)','Shortest Path'],
  'swim-in-rising-water':['Array','Binary Search','Depth-First Search','Breadth-First Search','Union Find','Heap (Priority Queue)','Matrix'],
  'alien-dictionary':['Array','String','Depth-First Search','Breadth-First Search','Graph','Topological Sort'],
  'cheapest-flights-within-k-stops':['Dynamic Programming','Depth-First Search','Breadth-First Search','Graph','Heap (Priority Queue)','Shortest Path'],
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
  'maximum-subarray':['Array','Divide and Conquer','Dynamic Programming'],
  'jump-game':['Array','Dynamic Programming','Greedy'],
  'jump-game-ii':['Array','Dynamic Programming','Greedy'],
  'gas-station':['Array','Greedy'],
  'hand-of-straights':['Array','Hash Table','Greedy','Sorting'],
  'merge-triplets-to-form-target-triplet':['Array','Greedy'],
  'partition-labels':['Hash Table','Two Pointers','String','Greedy'],
  'valid-parenthesis-string':['String','Dynamic Programming','Stack','Greedy'],
  'insert-interval':['Array'],
  'merge-intervals':['Array','Sorting'],
  'non-overlapping-intervals':['Array','Dynamic Programming','Greedy','Sorting'],
  'meeting-rooms':['Array','Sorting'],
  'meeting-rooms-ii':['Array','Two Pointers','Greedy','Sorting','Heap (Priority Queue)','Prefix Sum'],
  'minimum-interval-to-include-each-query':['Array','Binary Search','Line Sweep','Sorting','Heap (Priority Queue)'],
  'rotate-image':['Array','Math','Matrix'],
  'spiral-matrix':['Array','Matrix','Simulation'],
  'set-matrix-zeroes':['Array','Hash Table','Matrix'],
  'happy-number':['Hash Table','Math','Two Pointers'],
  'plus-one':['Array','Math'],
  'pow-x-n':['Math','Recursion'],
  'multiply-strings':['Math','String','Simulation'],
  'detect-squares':['Array','Hash Table','Design','Counting'],
  'single-number':['Array','Bit Manipulation'],
  'number-of-1-bits':['Divide and Conquer','Bit Manipulation'],
  'counting-bits':['Dynamic Programming','Bit Manipulation'],
  'reverse-bits':['Divide and Conquer','Bit Manipulation'],
  'missing-number':['Array','Hash Table','Math','Binary Search','Bit Manipulation','Sorting'],
  'sum-of-two-integers':['Math','Bit Manipulation'],
  'reverse-integer':['Math'],
};

const NC_DIFF = {
  'contains-duplicate':'Easy','valid-anagram':'Easy','two-sum':'Easy',
  'valid-palindrome':'Easy','best-time-to-buy-and-sell-stock':'Easy',
  'valid-parentheses':'Easy','binary-search':'Easy','reverse-linked-list':'Easy',
  'merge-two-sorted-lists':'Easy','linked-list-cycle':'Easy',
  'invert-binary-tree':'Easy','maximum-depth-of-binary-tree':'Easy',
  'diameter-of-binary-tree':'Easy','balanced-binary-tree':'Easy',
  'same-tree':'Easy','subtree-of-another-tree':'Easy',
  'kth-largest-element-in-a-stream':'Easy','last-stone-weight':'Easy',
  'climbing-stairs':'Easy','min-cost-climbing-stairs':'Easy',
  'happy-number':'Easy','plus-one':'Easy','single-number':'Easy',
  'number-of-1-bits':'Easy','counting-bits':'Easy','reverse-bits':'Easy',
  'missing-number':'Easy','meeting-rooms':'Easy',
};

// ─── Scheduler ────────────────────────────────────────────────────────────────

function buildDailyQueue(problems, settings) {
  const { dailyTarget = 5, blendRatio = 0.6 } = settings;
  const todayStr = today();

  let reviewSlots = Math.round(dailyTarget * blendRatio);
  let newSlots = dailyTarget - reviewSlots;
  if (newSlots < 1 && dailyTarget >= 2) { newSlots = 1; reviewSlots = dailyTarget - 1; }

  // Reviews due today (most overdue first)
  const dueToday = Object.entries(problems)
    .filter(([, p]) => p.status === 'review' && p.nextDue && p.nextDue <= todayStr)
    .sort(([, a], [, b]) => a.nextDue.localeCompare(b.nextDue))
    .slice(0, reviewSlots)
    .map(([slug]) => slug);

  // If there aren't enough due-today reviews to fill the review slots,
  // pull in the soonest-upcoming ones (even if not technically due yet).
  // This ensures the review deck always fills its slots — being a day or
  // two early is better than skipping a review slot entirely.
  const reviews = [...dueToday];
  if (reviews.length < reviewSlots) {
    const dueTodaySet = new Set(reviews);
    const upcoming = Object.entries(problems)
      .filter(([slug, p]) =>
        p.status === 'review' &&
        p.nextDue &&
        p.nextDue > todayStr &&
        !dueTodaySet.has(slug)
      )
      .sort(([, a], [, b]) => a.nextDue.localeCompare(b.nextDue))
      .slice(0, reviewSlots - reviews.length)
      .map(([slug]) => slug);
    reviews.push(...upcoming);
  }

  // Only truly unused slots (no review cards in the deck at all) spill to new
  const unusedReviewSlots = reviewSlots - reviews.length;

  const seen = new Set(Object.keys(problems));
  const newProblems = NC_ORDERED.filter(s => !seen.has(s)).slice(0, newSlots + unusedReviewSlots);

  return { reviews, newProblems };
}

// ─── One-time stagger migration ───────────────────────────────────────────────

/**
 * Recompute initial nextDue dates for problems that were onboarded with the
 * old over-conservative stagger (42–120 day offsets).
 * Only touches problems that have never been rated (history[0].rating === null
 * and history.length === 1) — i.e., still in their pristine onboarded state.
 */
function recomputeInitialStagger(problems) {
  const todayStr = today();
  const out = {};

  for (const [slug, p] of Object.entries(problems)) {
    // Only recompute cards that have never been rated
    const isVirgin = p.history && p.history.length === 1 && p.history[0].rating === null;
    if (!isVirgin) { out[slug] = p; continue; }

    const solvedDate = p.history[0].date;
    const a = new Date(solvedDate + 'T00:00:00Z');
    const b = new Date(todayStr + 'T00:00:00Z');
    const daysSince = Math.floor((b - a) / 86400000);

    let offset;
    if (daysSince >= 730)      offset = randInt(0, 3);
    else if (daysSince >= 180) offset = randInt(0, 7);
    else if (daysSince >= 90)  offset = randInt(3, 14);
    else if (daysSince >= 30)  offset = randInt(7, 21);
    else                       offset = randInt(14, 30);

    out[slug] = {
      ...p,
      interval: Math.max(1, offset || 1),
      nextDue: addDays(todayStr, offset),
    };
  }

  return out;
}

/**
 * Backfill tags for problems that have empty tags[] but appear in NC150_TAGS.
 * Also back-fills leetcodeDifficulty from NC_DIFF if missing.
 * Runs once, then tagsMigrated=true prevents re-runs.
 */
function backfillTags(problems) {
  const out = {};
  for (const [slug, p] of Object.entries(problems)) {
    const needsTags = !p.tags || p.tags.length === 0;
    const needsDiff = !p.leetcodeDifficulty;
    if ((needsTags || needsDiff) && (NC150_TAGS[slug] || NC_DIFF[slug])) {
      out[slug] = {
        ...p,
        tags: needsTags && NC150_TAGS[slug] ? NC150_TAGS[slug] : (p.tags || []),
        leetcodeDifficulty: needsDiff && NC_DIFF[slug] ? NC_DIFF[slug] : p.leetcodeDifficulty,
      };
    } else {
      out[slug] = p;
    }
  }
  return out;
}

function calcMissedDays(lastActive) {
  if (!lastActive) return 0;
  return Math.max(0, daysBetween(lastActive, today()) - 1);
}

function shiftDueDates(problems, n) {
  if (n <= 0) return problems;
  const out = {};
  for (const [slug, p] of Object.entries(problems)) {
    out[slug] = p.nextDue ? { ...p, nextDue: addDays(p.nextDue, n) } : { ...p };
  }
  return out;
}

function getWeakAreas(problems) {
  const stats = {};
  for (const p of Object.values(problems)) {
    if (!p.tags || !p.easeFactor) continue;
    for (const tag of p.tags) {
      if (!stats[tag]) stats[tag] = { count: 0, totalEase: 0 };
      stats[tag].count++;
      stats[tag].totalEase += p.easeFactor;
    }
  }
  return Object.entries(stats)
    .map(([tag, s]) => ({ tag, avgEase: s.totalEase / s.count, count: s.count }))
    .filter(x => x.count >= 1)
    .sort((a, b) => a.avgEase - b.avgEase)
    .slice(0, 12);
}

function buildCalData(problems) {
  const past         = {};  // date → completed count
  const future       = {};  // date → scheduled count
  const pastByDate   = {};  // date → [{ slug, title, rating }]
  const futureByDate = {};  // date → [{ slug, title, difficulty }]

  for (const [slug, p] of Object.entries(problems)) {
    const title = p.title || slugToTitle(slug);

    // Past: every history entry (including onboarding first-solve with null rating)
    for (const h of (p.history || [])) {
      if (!h.date) continue;
      past[h.date] = (past[h.date] || 0) + 1;
      if (!pastByDate[h.date]) pastByDate[h.date] = [];
      pastByDate[h.date].push({ slug, title, rating: h.rating });
    }

    // Future: upcoming scheduled reviews
    if (p.nextDue && p.status === 'review') {
      future[p.nextDue] = (future[p.nextDue] || 0) + 1;
      if (!futureByDate[p.nextDue]) futureByDate[p.nextDue] = [];
      futureByDate[p.nextDue].push({ slug, title, difficulty: p.leetcodeDifficulty });
    }
  }

  return { past, future, pastByDate, futureByDate };
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function slugToTitle(slug) {
  return slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

// ─── App state ────────────────────────────────────────────────────────────────

let S = null; // { problems, settings, session, username }

// ─── Boot ─────────────────────────────────────────────────────────────────────

// Wire onboarding buttons before any async — so they always work.
$('ob-open-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://leetcode.com' });
});
$('ob-refresh-btn').addEventListener('click', () => init());

init().catch(err => {
  console.error('[LeetRepeat] popup error:', err);
  show('ob-screen');
  hide('main-ui');
});

async function init() {
  const data = await storageGet([
    'onboarded','username','problems','settings','lastActiveDate','dailySession',
  ]);

  if (!data.onboarded) {
    show('ob-screen');
    hide('main-ui');
    pollForOnboarding();
    return;
  }

  hide('ob-screen');
  show('main-ui');

  $('lc-btn').onclick = () => chrome.tabs.create({ url: 'https://leetcode.com' });
  $('username-text').textContent = data.username || '';

  let problems = data.problems || {};
  const settings = { dailyTarget: 5, blendRatio: 0.6, ...(data.settings || {}) };
  const lastActiveDate = data.lastActiveDate || today();

  // ── One-time migration: fix over-conservative initial stagger ────────────
  if (!data.staggerMigrated) {
    problems = recomputeInitialStagger(problems);
    await storageSet({ problems, staggerMigrated: true });
  }

  // ── One-time migration: backfill missing tags from NC150_TAGS ─────────────
  // During onboarding, NC150_TAGS was truncated to ~20 entries so most
  // problems got tags:[]. This pass fills them in for all NC150 slugs.
  if (!data.tagsMigrated) {
    problems = backfillTags(problems);
    await storageSet({ problems, tagsMigrated: true });
  }

  const missed = calcMissedDays(lastActiveDate);
  let probs = missed > 0 ? shiftDueDates(problems, missed) : problems;
  if (missed > 0) await storageSet({ problems: probs });
  await storageSet({ lastActiveDate: today() });

  let session = data.dailySession;
  if (!session || session.date !== today()) {
    const { reviews, newProblems } = buildDailyQueue(probs, settings);
    session = {
      date: today(),
      queue: [...reviews, ...newProblems],
      reviewSlugs: reviews,
      newSlugs: newProblems,
      completed: [],
    };
    await storageSet({ dailySession: session });
  }

  S = { problems: probs, settings, session, username: data.username };

  renderToday();
  setupTabs();
  setupSettings();
}

function pollForOnboarding() {
  let dots = 0;
  const refreshBtn = $('ob-refresh-btn');
  const dotLabels = ['Check again', 'Checking.', 'Checking..', 'Checking...'];

  const iv = setInterval(async () => {
    const { onboarded, problems } = await storageGet(['onboarded','problems']);
    const count = Object.keys(problems || {}).length;

    if (count > 0) {
      show('ob-progress');
      $('ob-prog-fill').style.width = Math.min(92, count / 1.6) + '%';
      $('ob-prog-text').textContent = `${count} problems imported so far…`;
    }

    if (onboarded) {
      clearInterval(iv);
      init();
      return;
    }

    dots = (dots + 1) % 4;
    refreshBtn.childNodes[refreshBtn.childNodes.length - 1].textContent = ' ' + dotLabels[dots];
  }, 1500);
}

// ─── Today tab ────────────────────────────────────────────────────────────────

function renderToday() {
  const { problems, session } = S;
  const { reviewSlugs = [], newSlugs = [], completed = [] } = session;
  const todayStr = today();

  const total = reviewSlugs.length + newSlugs.length;
  const done  = completed.length;
  const left  = total - done;
  const backlog = Object.values(problems)
    .filter(p => p.status === 'review' && p.nextDue && p.nextDue <= todayStr).length;

  $('stat-done').textContent    = done;
  $('stat-left').textContent    = left;
  $('stat-backlog').textContent = backlog;

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const fill = $('progress-fill');
  fill.style.width = pct + '%';
  fill.classList.toggle('complete', pct === 100);
  $('progress-frac').textContent  = `${done} / ${total}`;
  $('progress-label').textContent = pct === 100 ? 'All done!' : 'Daily progress';

  // Empty states
  if (total === 0) {
    hide('prob-list-wrap');
    hide('empty-done');
    show('empty-queue');
    return;
  }
  if (done === total) {
    hide('prob-list-wrap');
    show('empty-done');
    hide('empty-queue');
    return;
  }
  show('prob-list-wrap');
  hide('empty-done');
  hide('empty-queue');

  // Reviews section
  $('review-count').textContent = reviewSlugs.length;
  const reviewList = $('review-list');
  reviewList.innerHTML = '';
  for (const slug of reviewSlugs) {
    reviewList.appendChild(makeCard(slug, 'review', completed.includes(slug), problems, todayStr));
  }

  // New section
  $('new-count').textContent = newSlugs.length;
  const newSection = $('new-section-hd');
  newSection.classList.toggle('hidden', newSlugs.length === 0);
  const newList = $('new-list');
  newList.innerHTML = '';
  for (const slug of newSlugs) {
    newList.appendChild(makeCard(slug, 'new', completed.includes(slug), problems, todayStr));
  }
}

function makeCard(slug, kind, isDone, problems, todayStr) {
  const p    = problems[slug];
  const title = p?.title || slugToTitle(slug);
  const diff  = p?.leetcodeDifficulty || NC_DIFF[slug] || 'Medium';

  let overdueHtml = '';
  if (kind === 'review' && p?.nextDue && p.nextDue < todayStr) {
    const days = daysBetween(p.nextDue, todayStr);
    const label = days === 1 ? '1d overdue' : `${days}d overdue`;
    overdueHtml = `<span class="pill pill-overdue">${icon('clock', 10)} ${label}</span>`;
  }

  const card = document.createElement('a');
  card.className = `prob-card${isDone ? ' done' : ''}`;
  card.dataset.diff = diff;
  card.href   = `https://leetcode.com/problems/${slug}/`;
  card.target = '_blank';
  card.rel    = 'noopener';

  card.innerHTML = `
    <div class="card-check-wrap">
      <div class="card-check">${isDone ? icon('check', 10) : ''}</div>
    </div>
    <div class="card-body">
      <span class="card-title">${esc(title)}</span>
      <div class="card-tags">
        <span class="pill pill-${kind}">${kind === 'review' ? 'Review' : 'New'}</span>
        <span class="pill pill-${diff.toLowerCase()}">${diff}</span>
        ${overdueHtml}
      </div>
    </div>
    <span class="card-link-icon">${icon('arrow-up-right', 13)}</span>
  `;

  // No click handler on the check circle — it is read-only.
  // Done state is set exclusively by the content script after a real
  // submission is rated via the Easy / Medium / Hard modal.

  return card;
}

// ─── Calendar tab ─────────────────────────────────────────────────────────────

function renderCalendar() {
  const { past: pastCal, future: futureCal, pastByDate, futureByDate } = buildCalData(S.problems);
  const todayStr  = today();
  const todayDate = new Date(todayStr + 'T00:00:00Z');

  // Grid: 48 weeks of history + 6 weeks of future = 54 total
  const PAST_WEEKS   = 48;
  const FUTURE_WEEKS = 6;
  const WEEKS        = PAST_WEEKS + FUTURE_WEEKS;
  const STRIDE       = 13.5; // px per week column (11px cell + 2.5px gap)
  const MONTHS       = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Start from the Sunday PAST_WEEKS full weeks ago
  const start = new Date(todayDate);
  start.setUTCDate(start.getUTCDate() - PAST_WEEKS * 7);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay()); // back to Sunday

  // ── Month labels (absolute-positioned, no overlap) ──────────────────────
  const monthsEl = $('cal-months');
  monthsEl.innerHTML = '';
  monthsEl.style.width = (WEEKS * STRIDE) + 'px';

  let lastLabelWeek = -4;
  let lastMonth = -1;
  const cur = new Date(start);

  for (let w = 0; w < WEEKS; w++) {
    const m = cur.getUTCMonth();
    if (m !== lastMonth && w - lastLabelWeek >= 4) {
      const lbl = document.createElement('span');
      lbl.className = 'cal-month-label';
      lbl.textContent = MONTHS[m];
      lbl.style.left  = (w * STRIDE) + 'px';
      monthsEl.appendChild(lbl);
      lastMonth     = m;
      lastLabelWeek = w;
    }
    cur.setUTCDate(cur.getUTCDate() + 7);
  }

  // ── Grid cells ───────────────────────────────────────────────────────────
  const grid = $('cal-grid');
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${WEEKS}, 11px)`;

  const maxPast   = Math.max(1, ...Object.values(pastCal));
  const maxFuture = Math.max(1, ...Object.values(futureCal));

  const cur2 = new Date(start);
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const dateStr  = cur2.toISOString().split('T')[0];
      const isFuture = dateStr > todayStr;
      const isToday  = dateStr === todayStr;

      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      cell.dataset.date = dateStr;
      if (isToday) cell.classList.add('cal-today');

      if (!isFuture) {
        const count = pastCal[dateStr] || 0;
        if (count > 0) {
          cell.setAttribute('data-level', Math.min(4, Math.ceil((count / maxPast) * 4)));
          cell.title = `${dateStr}  ·  ${count} solve${count !== 1 ? 's' : ''} — click for details`;
          cell.style.cursor = 'pointer';
        } else {
          cell.title = dateStr;
        }
      } else {
        const count = futureCal[dateStr] || 0;
        if (count > 0) {
          cell.setAttribute('data-sched', Math.min(4, Math.ceil((count / maxFuture) * 4)));
          cell.title = `${dateStr}  ·  ${count} review${count !== 1 ? 's' : ''} scheduled — click for details`;
          cell.style.cursor = 'pointer';
        } else {
          cell.style.opacity = '0.25';
          cell.title = dateStr;
        }
      }

      grid.appendChild(cell);
      cur2.setUTCDate(cur2.getUTCDate() + 1);
    }
  }

  // ── Cell click → detail panel ─────────────────────────────────────────────
  hide('cal-detail');  // reset on each re-render

  grid.addEventListener('click', e => {
    const cell = e.target.closest('.cal-cell[data-date]');
    if (!cell) return;
    const dateStr  = cell.dataset.date;
    const todayNow = today();
    const isFuture = dateStr > todayNow;
    const items    = isFuture
      ? (futureByDate[dateStr] || [])
      : (pastByDate[dateStr]   || []);
    if (items.length === 0) return;
    showCalDetail(dateStr, isFuture, items);
  });

  $('cal-detail-close').onclick = () => hide('cal-detail');

  // ── Scroll to show today near the right edge (leaving future weeks visible)
  const calWrapper = document.querySelector('.cal-wrapper');
  if (calWrapper) {
    // today is at week PAST_WEEKS, which is PAST_WEEKS*STRIDE px from left
    const todayPx = PAST_WEEKS * STRIDE;
    // Scroll so today is about 80% of the way across the visible area
    calWrapper.scrollLeft = Math.max(0, todayPx - calWrapper.clientWidth * 0.80);
  }

  // ── Summary stats (past only) ─────────────────────────────────────────────
  const pastCounts  = Object.values(pastCal);
  const totalSolves = pastCounts.reduce((a, b) => a + b, 0);
  const activeDays  = pastCounts.length;
  const bestDay     = Math.max(0, ...pastCounts);

  let streak = 0;
  const d = new Date(todayDate);
  while (pastCal[d.toISOString().split('T')[0]]) {
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }

  $('cal-total').textContent  = totalSolves;
  $('cal-active').textContent = activeDays;
  $('cal-streak').textContent = streak;
  $('cal-best').textContent   = bestDay;
}

// ─── Calendar detail panel ────────────────────────────────────────────────────

function showCalDetail(dateStr, isFuture, items) {
  // Human-readable date heading
  const d = new Date(dateStr + 'T00:00:00Z');
  const heading = d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  });

  $('cal-detail-heading').textContent = heading;
  $('cal-detail-type').textContent    = isFuture ? 'Scheduled' : 'Completed';
  $('cal-detail-type').style.color    = isFuture ? 'var(--purple)' : 'var(--blue)';

  const list = $('cal-detail-list');
  list.innerHTML = '';

  for (const item of items) {
    const a = document.createElement('a');
    a.className = 'cal-detail-item';
    a.href      = `https://leetcode.com/problems/${item.slug}/`;
    a.target    = '_blank';
    a.rel       = 'noopener';

    // Rating pill for past; difficulty pill for future
    const tag  = isFuture ? item.difficulty : item.rating;
    const cls  = tag ? `pill pill-${tag.toLowerCase()}` : '';
    const pill = tag ? `<span class="${cls}">${tag}</span>` : '';

    a.innerHTML = `
      <span class="cal-detail-title">${esc(item.title)}</span>
      ${pill}
      ${icon('arrow-up-right', 11)}
    `;
    list.appendChild(a);
  }

  show('cal-detail');
}

// ─── Weak areas tab ───────────────────────────────────────────────────────────

function renderWeakAreas() {
  const areas = getWeakAreas(S.problems);
  const list  = $('weak-list');
  list.innerHTML = '';

  if (areas.length === 0) {
    hide('weak-list');
    show('weak-empty');
    return;
  }
  show('weak-list');
  hide('weak-empty');

  const MIN_EF = 1.3, MAX_EF = 3.5;

  for (const area of areas) {
    const pct   = Math.round(((area.avgEase - MIN_EF) / (MAX_EF - MIN_EF)) * 100);
    const color = area.avgEase < 1.8 ? 'var(--red)' : area.avgEase < 2.3 ? 'var(--amber)' : 'var(--green)';
    const label = area.avgEase < 1.8 ? 'Hard' : area.avgEase < 2.3 ? 'Medium' : 'Easy';

    const item = document.createElement('div');
    item.className = 'weak-item';
    item.innerHTML = `
      <div class="weak-item-hd">
        <span class="weak-tag">${esc(area.tag)}</span>
        <span class="weak-meta">${label} · ${area.count} problem${area.count !== 1 ? 's' : ''}</span>
      </div>
      <div class="weak-track">
        <div class="weak-fill" style="width:${Math.max(4, pct)}%;background:${color}"></div>
      </div>
    `;
    list.appendChild(item);
  }
}

// ─── Settings tab ─────────────────────────────────────────────────────────────

function setupSettings() {
  const { settings } = S;
  const targetVal   = $('target-val');
  const blendSlider = $('blend-slider');

  targetVal.value   = settings.dailyTarget;
  blendSlider.value = Math.round(settings.blendRatio * 100);

  // Compute the snapped review count and percentage for the current slider + target.
  // Each valid position corresponds to an actual integer split (r reviews, n new).
  // Positions between integer-split thresholds produce the same split, so we snap
  // the slider thumb to the canonical percentage for the computed split — this way
  // the user can only land on positions where the numbers visibly change.
  function getSnapped() {
    const target = Math.max(1, parseInt(targetVal.value) || 5);
    const rawPct = parseInt(blendSlider.value);

    let rc = Math.round(target * rawPct / 100);
    // Always keep at least 1 new slot
    if (target >= 2) rc = Math.min(rc, target - 1);
    rc = Math.max(0, rc);

    const nc      = target - rc;
    const snapPct = Math.round((rc / target) * 100);
    return { target, rc, nc, snapPct };
  }

  function syncBlend() {
    const { rc, nc, snapPct } = getSnapped();

    // Snap the slider thumb so it only rests at meaningful positions
    blendSlider.value = snapPct;

    $('blend-review-lbl').textContent = `${rc} review${rc !== 1 ? 's' : ''}`;
    $('blend-new-lbl').textContent    = `${nc} new`;
    $('blend-bar-review').style.width = snapPct + '%';
    $('blend-bar-review').textContent = rc;
    $('blend-bar-new').textContent    = nc;
  }

  $('target-dec').onclick = () => {
    targetVal.value = Math.max(1, parseInt(targetVal.value) - 1);
    syncBlend();
  };
  $('target-inc').onclick = () => {
    targetVal.value = Math.min(50, parseInt(targetVal.value) + 1);
    syncBlend();
  };
  targetVal.addEventListener('input', syncBlend);
  blendSlider.addEventListener('input', syncBlend);
  syncBlend();

  $('settings-form').addEventListener('submit', async e => {
    e.preventDefault();
    const { target, rc } = getSnapped();
    const newSettings = {
      dailyTarget: target,
      blendRatio:  rc / target,   // exact ratio, not raw slider %
    };
    await storageSet({ settings: newSettings });
    S.settings = newSettings;

    const { reviews, newProblems } = buildDailyQueue(S.problems, newSettings);
    S.session = {
      date: today(),
      queue: [...reviews, ...newProblems],
      reviewSlugs: reviews,
      newSlugs: newProblems,
      completed: S.session.completed || [],
    };
    await storageSet({ dailySession: S.session });
    renderToday();

    const confirm = $('save-confirm');
    confirm.classList.remove('hidden');
    setTimeout(() => confirm.classList.add('hidden'), 2200);
  });

  $('reset-btn').addEventListener('click', async () => {
    if (!confirm('Reset all LeetRepeat data? This cannot be undone.')) return;
    await new Promise(r => chrome.storage.local.clear(r));
    location.reload();
  });
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function setupTabs() {
  const tabs   = document.querySelectorAll('.tab');
  const panels = ['today','calendar','weak','settings'];

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const name = tab.dataset.tab;
      panels.forEach(p => $(`tab-${p}`).classList.toggle('hidden', p !== name));
      if (name === 'calendar') renderCalendar();
      if (name === 'weak')     renderWeakAreas();
    });
  });
}
