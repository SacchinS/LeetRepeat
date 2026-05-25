'use strict';

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

// ─── Date helpers ────────────────────────────────────────────────────────────

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

// ─── SM-2 ────────────────────────────────────────────────────────────────────

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

// ─── Neetcode 150 (ordered for new problem suggestions) ──────────────────────

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

// Difficulty lookup for problems not yet enriched
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

// ─── Scheduler ───────────────────────────────────────────────────────────────

function buildDailyQueue(problems, settings) {
  const { dailyTarget = 5, blendRatio = 0.6 } = settings;
  const todayStr = today();

  let reviewSlots = Math.round(dailyTarget * blendRatio);
  let newSlots = dailyTarget - reviewSlots;
  if (newSlots < 1 && dailyTarget >= 2) { newSlots = 1; reviewSlots = dailyTarget - 1; }

  const overdue = Object.entries(problems)
    .filter(([, p]) => p.status === 'review' && p.nextDue && p.nextDue <= todayStr)
    .sort(([, a], [, b]) => a.nextDue.localeCompare(b.nextDue))
    .slice(0, reviewSlots)
    .map(([slug]) => slug);

  const seen = new Set(Object.keys(problems));
  const newProblems = NC_ORDERED.filter(s => !seen.has(s)).slice(0, newSlots);

  return { reviews: overdue, newProblems };
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
  const cal = {};
  for (const p of Object.values(problems)) {
    for (const h of (p.history || [])) {
      if (h.date) cal[h.date] = (cal[h.date] || 0) + 1;
    }
  }
  return cal;
}

// ─── DOM helpers ─────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);
function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }
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

// ─── Boot ────────────────────────────────────────────────────────────────────

// Wire up onboarding buttons immediately — before any async work
// so they work even if the user is not yet onboarded.
$('ob-open-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://leetcode.com' });
});
$('ob-refresh-btn').addEventListener('click', () => init());

init().catch(err => {
  console.error('[LeetRepeat] popup init error:', err);
  show('onboarding-screen');
  hide('main-ui');
  $('ob-refresh-btn').textContent = 'Retry ↺';
});

async function init() {
  const data = await storageGet([
    'onboarded','username','problems','settings','lastActiveDate','dailySession',
  ]);

  if (!data.onboarded) {
    show('onboarding-screen');
    hide('main-ui');
    pollForOnboarding();
    return;
  }

  hide('onboarding-screen');
  show('main-ui');

  // Wire header button (safe to re-attach due to replaceWith trick not needed here)
  $('lc-btn').onclick = () => chrome.tabs.create({ url: 'https://leetcode.com' });
  $('username-chip').textContent = data.username || '';

  const problems = data.problems || {};
  const settings = { dailyTarget: 5, blendRatio: 0.6, ...(data.settings || {}) };
  const lastActiveDate = data.lastActiveDate || today();

  // Missed day shift
  const missed = calcMissedDays(lastActiveDate);
  let probs = missed > 0 ? shiftDueDates(problems, missed) : problems;
  if (missed > 0) await storageSet({ problems: probs });
  await storageSet({ lastActiveDate: today() });

  // Build / restore session
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

// Poll storage every 1.5 s while onboarding is in progress
// so the popup auto-advances once content.js finishes the import.
function pollForOnboarding() {
  let dots = 0;
  const btn = $('ob-refresh-btn');
  const interval = setInterval(async () => {
    const { onboarded, problems } = await storageGet(['onboarded','problems']);
    const count = Object.keys(problems || {}).length;

    // Show progress if content script has started writing
    if (count > 0) {
      show('ob-progress');
      $('ob-progress-fill').style.width = Math.min(95, count / 2) + '%';
      $('ob-progress-text').textContent = `Imported ${count} problems so far…`;
    }

    if (onboarded) {
      clearInterval(interval);
      init(); // re-run full init now that we're onboarded
    }

    dots = (dots + 1) % 4;
    btn.textContent = 'Check again' + '.'.repeat(dots) + ' ↺';
  }, 1500);
}

// ─── Today tab ───────────────────────────────────────────────────────────────

function renderToday() {
  const { problems, session } = S;
  const { reviewSlugs = [], newSlugs = [], completed = [] } = session;
  const todayStr = today();

  const totalQueue = reviewSlugs.length + newSlugs.length;
  const done = completed.length;
  const left = totalQueue - done;

  const backlog = Object.values(problems)
    .filter(p => p.status === 'review' && p.nextDue && p.nextDue <= todayStr).length;

  // Stats
  $('stat-done').textContent = done;
  $('stat-left').textContent = left;
  $('stat-backlog').textContent = backlog;

  // Progress bar
  const pct = totalQueue > 0 ? Math.round((done / totalQueue) * 100) : 0;
  const fill = $('progress-fill');
  fill.style.width = pct + '%';
  fill.classList.toggle('complete', pct === 100);
  $('progress-frac').textContent = `${done} / ${totalQueue}`;
  $('progress-label').textContent = pct === 100 ? '🎉 All done!' : 'Daily progress';

  // If everything is done, show celebration
  if (totalQueue > 0 && done === totalQueue) {
    hide('problem-list-wrap');
    show('empty-all-done');
    hide('empty-no-queue');
    return;
  }

  if (totalQueue === 0) {
    hide('problem-list-wrap');
    hide('empty-all-done');
    show('empty-no-queue');
    return;
  }

  show('problem-list-wrap');
  hide('empty-all-done');
  hide('empty-no-queue');

  // Render review cards
  const reviewList = $('review-list');
  reviewList.innerHTML = '';
  $('review-count-label').textContent = reviewSlugs.length;

  for (const slug of reviewSlugs) {
    reviewList.appendChild(makeCard(slug, 'review', completed.includes(slug), problems, todayStr));
  }

  // Render new problem cards
  const newList = $('new-list');
  newList.innerHTML = '';
  $('new-count-label').textContent = newSlugs.length;

  // Hide the divider + new section header if no new problems
  $('new-divider').classList.toggle('hidden', newSlugs.length === 0);

  for (const slug of newSlugs) {
    newList.appendChild(makeCard(slug, 'new', completed.includes(slug), problems, todayStr));
  }
}

function makeCard(slug, kind, isDone, problems, todayStr) {
  const p = problems[slug];
  const title = p?.title || slugToTitle(slug);
  const diff = p?.leetcodeDifficulty || NC_DIFF[slug] || 'Medium';

  let overdueLabel = '';
  if (kind === 'review' && p?.nextDue && p.nextDue < todayStr) {
    const days = daysBetween(p.nextDue, todayStr);
    overdueLabel = days === 1 ? '1 day overdue' : `${days} days overdue`;
  }

  const card = document.createElement('a');
  card.className = 'problem-card' + (isDone ? ' done' : '');
  card.dataset.diff = diff;
  card.href = `https://leetcode.com/problems/${slug}/`;
  card.target = '_blank';
  card.rel = 'noopener';

  card.innerHTML = `
    <div class="card-check" data-slug="${esc(slug)}">
      <span class="card-check-icon">✓</span>
    </div>
    <div class="card-body">
      <span class="card-title">${esc(title)}</span>
      <div class="card-tags">
        <span class="pill pill-${kind}">${kind === 'review' ? 'Review' : 'New'}</span>
        <span class="pill pill-${diff.toLowerCase()}">${diff}</span>
        ${overdueLabel ? `<span class="pill pill-overdue">${overdueLabel}</span>` : ''}
      </div>
    </div>
    <span class="card-link" aria-hidden="true">↗</span>
  `;

  // Clicking the check circle toggles done; clicking the card body opens LeetCode
  card.querySelector('.card-check').addEventListener('click', async e => {
    e.preventDefault();
    e.stopPropagation();
    await toggleDone(slug);
  });

  return card;
}

async function toggleDone(slug) {
  const { session } = S;
  const idx = session.completed.indexOf(slug);
  if (idx === -1) session.completed.push(slug);
  else session.completed.splice(idx, 1);
  await storageSet({ dailySession: session });
  renderToday();
}

// ─── Calendar tab ─────────────────────────────────────────────────────────────

function renderCalendar() {
  const calData = buildCalData(S.problems);
  const todayStr = today();
  const todayDate = new Date(todayStr + 'T00:00:00Z');

  // Start from the Sunday 52 weeks ago
  const start = new Date(todayDate);
  start.setUTCDate(start.getUTCDate() - 52 * 7);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay()); // align to Sunday

  const grid = $('calendar-grid');
  const monthsEl = $('cal-months');
  grid.innerHTML = '';
  monthsEl.innerHTML = '';

  const maxCount = Math.max(1, ...Object.values(calData));
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  let lastMonth = -1;
  let col = 0;

  const cur = new Date(start);
  for (let week = 0; week < 53; week++) {
    // Month label for this column
    const monthOfWeek = cur.getUTCMonth();
    const monthLabel = document.createElement('div');
    monthLabel.className = 'cal-month-label';
    monthLabel.style.gridColumn = `${week + 1}`;
    if (monthOfWeek !== lastMonth) {
      monthLabel.textContent = MONTHS[monthOfWeek];
      lastMonth = monthOfWeek;
    }
    monthsEl.appendChild(monthLabel);

    for (let day = 0; day < 7; day++) {
      const dateStr = cur.toISOString().split('T')[0];
      const count = calData[dateStr] || 0;
      const isFuture = dateStr > todayStr;

      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      if (dateStr === todayStr) cell.classList.add('today-cell');
      if (!isFuture && count > 0) {
        cell.setAttribute('data-level', Math.min(4, Math.ceil((count / maxCount) * 4)));
      }
      if (isFuture) cell.style.opacity = '0.15';
      cell.title = `${dateStr}  ·  ${count} solve${count !== 1 ? 's' : ''}`;
      grid.appendChild(cell);

      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  // Summary stats
  const allCounts = Object.values(calData);
  const totalSolves = allCounts.reduce((a, b) => a + b, 0);
  const activeDays = allCounts.length;
  const bestDay = Math.max(0, ...allCounts);

  // Streak: count consecutive days ending today
  let streak = 0;
  let d = new Date(todayDate);
  while (true) {
    const ds = d.toISOString().split('T')[0];
    if (!calData[ds]) break;
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }

  $('cal-total').textContent = totalSolves;
  $('cal-active').textContent = activeDays;
  $('cal-streak').textContent = streak;
  $('cal-best').textContent = bestDay;
}

// ─── Weak areas tab ───────────────────────────────────────────────────────────

function renderWeakAreas() {
  const areas = getWeakAreas(S.problems);
  const list = $('weak-list');
  list.innerHTML = '';

  if (areas.length === 0) {
    hide('weak-list');
    show('weak-empty');
    return;
  }

  show('weak-list');
  hide('weak-empty');

  const MIN_EASE = 1.3, MAX_EASE = 3.5;

  for (const area of areas) {
    const pct = Math.round(((area.avgEase - MIN_EASE) / (MAX_EASE - MIN_EASE)) * 100);
    const color = area.avgEase < 1.8 ? 'var(--red)' : area.avgEase < 2.3 ? 'var(--yellow)' : 'var(--green)';
    const label = area.avgEase < 1.8 ? '🔴 Hard' : area.avgEase < 2.3 ? '🟡 Medium' : '🟢 Easy';

    const item = document.createElement('div');
    item.className = 'weak-item';
    item.innerHTML = `
      <div class="weak-item-top">
        <span class="weak-tag">${esc(area.tag)}</span>
        <span class="weak-meta">${label} · ${area.count} problem${area.count !== 1 ? 's' : ''}</span>
      </div>
      <div class="weak-bar-track">
        <div class="weak-bar-fill" style="width:${Math.max(4, pct)}%;background:${color}"></div>
      </div>
    `;
    list.appendChild(item);
  }
}

// ─── Settings tab ─────────────────────────────────────────────────────────────

function setupSettings() {
  const { settings } = S;
  const targetVal = $('target-val');
  const blendSlider = $('blend-slider');

  targetVal.value = settings.dailyTarget;
  blendSlider.value = Math.round(settings.blendRatio * 100);

  function updateBlendPreview() {
    const target = parseInt(targetVal.value) || 5;
    const reviewPct = parseInt(blendSlider.value);
    const newPct = 100 - reviewPct;
    const reviewCount = Math.round(target * reviewPct / 100);
    const newCount = Math.max(0, target - reviewCount);

    $('blend-review-label').textContent = `${reviewPct}% reviews`;
    $('blend-new-label').textContent = `${newPct}% new`;
    $('blend-preview-review').style.width = reviewPct + '%';
    $('blend-preview-review').textContent = reviewCount;
    $('blend-preview-new').textContent = newCount;
  }

  // Stepper buttons
  $('target-dec').onclick = () => {
    targetVal.value = Math.max(1, parseInt(targetVal.value) - 1);
    updateBlendPreview();
  };
  $('target-inc').onclick = () => {
    targetVal.value = Math.min(50, parseInt(targetVal.value) + 1);
    updateBlendPreview();
  };
  targetVal.addEventListener('input', updateBlendPreview);
  blendSlider.addEventListener('input', updateBlendPreview);

  updateBlendPreview();

  // Save
  $('settings-form').addEventListener('submit', async e => {
    e.preventDefault();
    const newSettings = {
      dailyTarget: parseInt(targetVal.value) || 5,
      blendRatio: parseInt(blendSlider.value) / 100,
    };
    await storageSet({ settings: newSettings });
    S.settings = newSettings;

    // Rebuild today's session
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
    setTimeout(() => confirm.classList.add('hidden'), 2000);
  });

  // Reset
  $('reset-btn').addEventListener('click', async () => {
    if (!confirm('Reset all LeetRepeat data? This cannot be undone.')) return;
    await new Promise(r => chrome.storage.local.clear(r));
    location.reload();
  });
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = ['today','calendar','weak','settings'];

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const name = tab.dataset.tab;
      panels.forEach(p => {
        $(`tab-${p}`).classList.toggle('hidden', p !== name);
      });
      if (name === 'calendar') renderCalendar();
      if (name === 'weak') renderWeakAreas();
    });
  });
}
