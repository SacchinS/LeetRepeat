/**
 * LeetRepeat Popup script
 * Dashboard: Today's checklist, calendar heatmap, weak areas, settings.
 */

'use strict';

// ─── Utilities ────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function daysBetween(from, to) {
  const a = new Date(from + 'T00:00:00Z');
  const b = new Date(to + 'T00:00:00Z');
  return Math.floor((b - a) / 86400000);
}

function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, result => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(result);
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

// ─── SM-2 (inline, no module support in MV3 popup without bundler) ─────────

const RATING_Q = { Easy: 5, Medium: 3, Hard: 1 };

function applySm2(card, rating, todayStr) {
  const q = RATING_Q[rating];
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

// ─── Scheduler (inline) ───────────────────────────────────────────────────────

const NEETCODE_SLUGS = new Set([
  'two-sum','contains-duplicate','valid-anagram','group-anagrams',
  'top-k-frequent-elements','product-of-array-except-self','valid-sudoku',
  'encode-and-decode-strings','longest-consecutive-sequence','valid-palindrome',
  'two-sum-ii-input-array-is-sorted','3sum','container-with-most-water',
  'trapping-rain-water','best-time-to-buy-and-sell-stock',
  'longest-substring-without-repeating-characters',
  'longest-repeating-character-replacement','permutation-in-string',
  'minimum-window-substring','sliding-window-maximum','valid-parentheses',
  'min-stack','evaluate-reverse-polish-notation','generate-parentheses',
  'daily-temperatures','car-fleet','largest-rectangle-in-histogram',
  'binary-search','search-a-2d-matrix','koko-eating-bananas',
  'find-minimum-in-rotated-sorted-array','search-in-rotated-sorted-array',
  'time-based-key-value-store','median-of-two-sorted-arrays',
  'reverse-linked-list','merge-two-sorted-lists','reorder-list',
  'remove-nth-node-from-end-of-list','copy-list-with-random-pointer',
  'add-two-numbers','linked-list-cycle','find-the-duplicate-number',
  'lru-cache','merge-k-sorted-lists','reverse-nodes-in-k-group',
  'invert-binary-tree','maximum-depth-of-binary-tree','diameter-of-binary-tree',
  'balanced-binary-tree','same-tree','subtree-of-another-tree',
  'lowest-common-ancestor-of-a-binary-search-tree',
  'binary-tree-level-order-traversal','binary-tree-right-side-view',
  'count-good-nodes-in-binary-tree','validate-binary-search-tree',
  'kth-smallest-element-in-a-bst',
  'construct-binary-tree-from-preorder-and-inorder-traversal',
  'binary-tree-maximum-path-sum','serialize-and-deserialize-binary-tree',
  'implement-trie-prefix-tree','design-add-and-search-words-data-structure',
  'word-search-ii','kth-largest-element-in-a-stream','last-stone-weight',
  'k-closest-points-to-origin','kth-largest-element-in-an-array',
  'task-scheduler','design-twitter','find-median-from-data-stream',
  'subsets','combination-sum','permutations','subsets-ii','combination-sum-ii',
  'word-search','palindrome-partitioning','letter-combinations-of-a-phone-number',
  'n-queens','number-of-islands','clone-graph','max-area-of-island',
  'pacific-atlantic-water-flow','surrounded-regions','rotting-oranges',
  'walls-and-gates','course-schedule','course-schedule-ii','redundant-connection',
  'number-of-connected-components-in-an-undirected-graph','graph-valid-tree',
  'word-ladder','reconstruct-itinerary','min-cost-to-connect-all-points',
  'network-delay-time','swim-in-rising-water','alien-dictionary',
  'cheapest-flights-within-k-stops','climbing-stairs','min-cost-climbing-stairs',
  'house-robber','house-robber-ii','longest-palindromic-substring',
  'palindromic-substrings','decode-ways','coin-change','maximum-product-subarray',
  'word-break','longest-increasing-subsequence','partition-equal-subset-sum',
  'unique-paths','longest-common-subsequence',
  'best-time-to-buy-and-sell-stock-with-cooldown','coin-change-ii','target-sum',
  'interleaving-string','longest-increasing-path-in-a-matrix',
  'distinct-subsequences','edit-distance','burst-balloons',
  'regular-expression-matching','maximum-subarray','jump-game','jump-game-ii',
  'gas-station','hand-of-straights','merge-triplets-to-form-target-triplet',
  'partition-labels','valid-parenthesis-string','insert-interval','merge-intervals',
  'non-overlapping-intervals','meeting-rooms','meeting-rooms-ii',
  'minimum-interval-to-include-each-query','rotate-image','spiral-matrix',
  'set-matrix-zeroes','happy-number','plus-one','pow-x-n','multiply-strings',
  'detect-squares','single-number','number-of-1-bits','counting-bits',
  'reverse-bits','missing-number','sum-of-two-integers','reverse-integer',
]);

// Neetcode 150 in order (for new problem selection)
const NEETCODE_ORDERED = [
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

const NC_DIFFICULTY = {
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

function buildDailyQueue(problems, settings) {
  const { dailyTarget = 5, blendRatio = 0.6 } = settings;
  const todayStr = today();

  let reviewSlots = Math.round(dailyTarget * blendRatio);
  let newSlots = dailyTarget - reviewSlots;
  if (newSlots < 1 && dailyTarget >= 2) { newSlots = 1; reviewSlots = dailyTarget - 1; }

  // Overdue reviews
  const overdue = Object.entries(problems)
    .filter(([, p]) => p.status === 'review' && p.nextDue && p.nextDue <= todayStr)
    .sort(([, a], [, b]) => a.nextDue.localeCompare(b.nextDue))
    .slice(0, reviewSlots)
    .map(([slug]) => slug);

  // New problems (not in deck yet, from Neetcode 150 in order)
  const seenSlugs = new Set(Object.keys(problems));
  const newProblems = NEETCODE_ORDERED
    .filter(slug => !seenSlugs.has(slug))
    .slice(0, newSlots);

  return { reviews: overdue, newProblems };
}

function calcMissedDays(lastActiveDateStr) {
  if (!lastActiveDateStr) return 0;
  return Math.max(0, daysBetween(lastActiveDateStr, today()) - 1);
}

function shiftDueDates(problems, missedDays) {
  if (missedDays <= 0) return problems;
  const updated = {};
  for (const [slug, p] of Object.entries(problems)) {
    updated[slug] = p.nextDue
      ? { ...p, nextDue: addDays(p.nextDue, missedDays) }
      : { ...p };
  }
  return updated;
}

function getWeakAreaSummary(problems) {
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
    .sort((a, b) => a.avgEase - b.avgEase)
    .slice(0, 10);
}

function buildCalendarData(problems) {
  const cal = {};
  for (const p of Object.values(problems)) {
    for (const h of (p.history || [])) {
      if (h.date) cal[h.date] = (cal[h.date] || 0) + 1;
    }
  }
  return cal;
}

// ─── Main App ─────────────────────────────────────────────────────────────────

let appState = null; // { problems, settings, session, username }

async function init() {
  // Load all storage
  const data = await storageGet([
    'onboarded', 'username', 'problems', 'settings',
    'lastActiveDate', 'dailySession',
  ]);

  // Not onboarded yet
  if (!data.onboarded) {
    // Check if user is on leetcode.com; content script handles onboarding
    show('onboarding-state');
    hide('main-ui');
    hide('not-signed-in');
    document.getElementById('onboarding-status').textContent =
      'Open leetcode.com in a tab to begin importing your history.';
    return;
  }

  const problems = data.problems || {};
  const settings = { dailyTarget: 5, blendRatio: 0.6, ...(data.settings || {}) };
  const lastActiveDate = data.lastActiveDate || today();

  // Handle missed days
  const missedDays = calcMissedDays(lastActiveDate);
  let updatedProblems = problems;
  if (missedDays > 0) {
    updatedProblems = shiftDueDates(problems, missedDays);
    await storageSet({ problems: updatedProblems });
  }

  // Update last active date to today
  await storageSet({ lastActiveDate: today() });

  // Build or restore daily session
  let session = data.dailySession;
  if (!session || session.date !== today()) {
    const { reviews, newProblems } = buildDailyQueue(updatedProblems, settings);
    session = {
      date: today(),
      queue: [...reviews, ...newProblems],
      reviewSlugs: reviews,
      newSlugs: newProblems,
      completed: [],
    };
    await storageSet({ dailySession: session });
  }

  appState = { problems: updatedProblems, settings, session, username: data.username };

  show('main-ui');
  hide('onboarding-state');
  hide('not-signed-in');

  renderTodayTab();
  setupTabs();
  setupSettings();

  document.getElementById('open-leetcode-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://leetcode.com' });
  });
}

// ─── Today Tab ────────────────────────────────────────────────────────────────

function renderTodayTab() {
  const { problems, session, settings } = appState;
  const { queue, completed } = session;

  const total = queue.length;
  const done = completed.length;
  const remaining = total - done;

  // Stats
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-remaining').textContent = remaining;

  // Total cards due (including backlog not in today's queue)
  const todayStr = today();
  const totalDue = Object.values(problems)
    .filter(p => p.status === 'review' && p.nextDue && p.nextDue <= todayStr).length;
  document.getElementById('stat-due').textContent = totalDue;

  // Progress bar
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = `${done} / ${total}`;

  // Checklist
  const list = document.getElementById('checklist');
  const empty = document.getElementById('checklist-empty');
  list.innerHTML = '';

  if (queue.length === 0) {
    list.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  list.classList.remove('hidden');
  empty.classList.add('hidden');

  for (const slug of queue) {
    const isDone = completed.includes(slug);
    const problem = problems[slug];
    const isNew = session.newSlugs?.includes(slug);
    const title = problem?.title || slugToTitle(slug);
    const diff = problem?.leetcodeDifficulty || NC_DIFFICULTY[slug] || 'Medium';

    const li = document.createElement('li');
    li.className = 'checklist-item' + (isDone ? ' done' : '');
    li.dataset.slug = slug;

    li.innerHTML = `
      <div class="check-circle"></div>
      <div class="item-info">
        <div class="item-title">${escHtml(title)}</div>
        <div class="item-meta">
          <span class="badge ${isNew ? 'badge-new' : 'badge-review'}">${isNew ? 'New' : 'Review'}</span>
          <span class="badge badge-${diff.toLowerCase()}">${diff}</span>
        </div>
      </div>
      <a class="item-link" href="https://leetcode.com/problems/${slug}/" target="_blank" title="Open on LeetCode">↗</a>
    `;

    // Click to toggle done
    li.addEventListener('click', async (e) => {
      if (e.target.classList.contains('item-link') || e.target.closest('.item-link')) return;
      await toggleCompleted(slug);
    });

    list.appendChild(li);
  }
}

async function toggleCompleted(slug) {
  const { session, problems, settings } = appState;
  const todayStr = today();
  const idx = session.completed.indexOf(slug);

  if (idx === -1) {
    // Mark done
    session.completed.push(slug);
    // If it's a review card, advance the due date with a "Medium" default
    // (The actual rating comes from the content script modal)
    // Just mark as touched; the content script handles SM-2 on actual solve
  } else {
    session.completed.splice(idx, 1);
  }

  await storageSet({ dailySession: session });
  appState.session = session;
  renderTodayTab();
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────

function renderCalendarTab() {
  const { problems } = appState;
  const calData = buildCalendarData(problems);
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  // Build 52 weeks × 7 days ending today
  const todayStr = today();
  const todayDate = new Date(todayStr + 'T00:00:00Z');
  // Find Sunday that starts the last 52 weeks
  const startDate = new Date(todayDate);
  startDate.setUTCDate(startDate.getUTCDate() - (52 * 7) + 1);
  // Align to Sunday
  startDate.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay());

  // Build cells: grid is 7 rows × 53 cols, column = week, row = day of week
  const cells = [];
  const cur = new Date(startDate);
  for (let week = 0; week < 53; week++) {
    for (let day = 0; day < 7; day++) {
      cells.push(new Date(cur));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  // Rearrange to column-major for CSS grid (7 rows, then next column)
  const maxCount = Math.max(1, ...Object.values(calData));
  for (const date of cells) {
    const dateStr = date.toISOString().split('T')[0];
    const count = calData[dateStr] || 0;
    const isFuture = dateStr > todayStr;

    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    if (!isFuture && count > 0) {
      const level = Math.ceil((count / maxCount) * 4);
      cell.setAttribute('data-level', Math.min(4, level));
    }
    if (isFuture) cell.style.opacity = '0.2';
    cell.title = `${dateStr}: ${count} solve${count !== 1 ? 's' : ''}`;
    grid.appendChild(cell);
  }
}

// ─── Weak Areas Tab ───────────────────────────────────────────────────────────

function renderWeakAreaTab() {
  const { problems } = appState;
  const areas = getWeakAreaSummary(problems);
  const list = document.getElementById('weak-area-list');
  const empty = document.getElementById('weak-area-empty');
  list.innerHTML = '';

  if (areas.length === 0) {
    list.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  list.classList.remove('hidden');
  empty.classList.add('hidden');

  // Normalize ease to 0–100% bar width (1.3 min, 3.5 max)
  const MIN_EASE = 1.3, MAX_EASE = 3.5;

  for (const area of areas) {
    const pct = Math.max(5, Math.round(((area.avgEase - MIN_EASE) / (MAX_EASE - MIN_EASE)) * 100));
    const color = area.avgEase < 1.8 ? 'var(--red)' : area.avgEase < 2.3 ? 'var(--yellow)' : 'var(--green)';
    const label = area.avgEase < 1.8 ? '🔴 Hard' : area.avgEase < 2.3 ? '🟡 Medium' : '🟢 Easy';

    const item = document.createElement('div');
    item.className = 'weak-area-item';
    item.innerHTML = `
      <div class="weak-area-name">${escHtml(area.tag)}</div>
      <div class="weak-area-bar-track">
        <div class="weak-area-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="weak-area-count">${label} · ${area.count}</div>
    `;
    list.appendChild(item);
  }
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function setupSettings() {
  const { settings } = appState;
  const targetInput = document.getElementById('daily-target');
  const blendInput = document.getElementById('blend-ratio');

  targetInput.value = settings.dailyTarget;
  blendInput.value = Math.round(settings.blendRatio * 100);

  function updatePreview() {
    const target = parseInt(targetInput.value, 10) || 5;
    const blend = parseInt(blendInput.value, 10) / 100;
    const reviews = Math.round(target * blend);
    const newP = target - reviews;

    document.getElementById('blend-reviews-label').textContent = `${blendInput.value}% reviews`;
    document.getElementById('blend-new-label').textContent = `${100 - parseInt(blendInput.value)}% new`;
    document.getElementById('settings-preview-target').textContent = target;
    document.getElementById('settings-preview-reviews').textContent = reviews;
    document.getElementById('settings-preview-new').textContent = newP;
  }

  targetInput.addEventListener('input', updatePreview);
  blendInput.addEventListener('input', updatePreview);
  updatePreview();

  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newSettings = {
      dailyTarget: parseInt(targetInput.value, 10) || 5,
      blendRatio: parseInt(blendInput.value, 10) / 100,
    };
    await storageSet({ settings: newSettings });
    appState.settings = newSettings;

    // Rebuild session with new settings
    const { reviews, newProblems } = buildDailyQueue(appState.problems, newSettings);
    const session = {
      date: today(),
      queue: [...reviews, ...newProblems],
      reviewSlugs: reviews,
      newSlugs: newProblems,
      completed: appState.session.completed || [],
    };
    await storageSet({ dailySession: session });
    appState.session = session;

    const savedEl = document.getElementById('settings-saved');
    savedEl.classList.remove('hidden');
    setTimeout(() => savedEl.classList.add('hidden'), 2000);

    renderTodayTab();
  });
}

// ─── Tab switching ────────────────────────────────────────────────────────────

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const name = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      ['today', 'calendar', 'weak', 'settings'].forEach(t => {
        document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== name);
      });

      // Lazy render
      if (name === 'calendar') renderCalendarTab();
      if (name === 'weak') renderWeakAreaTab();
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugToTitle(slug) {
  return slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

init().catch(err => {
  console.error('[LeetRepeat] Popup init error:', err);
  document.getElementById('onboarding-state').classList.remove('hidden');
  document.getElementById('onboarding-status').textContent = 'Error: ' + err.message;
});
