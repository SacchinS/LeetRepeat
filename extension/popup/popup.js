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

  const overdue = Object.entries(problems)
    .filter(([, p]) => p.status === 'review' && p.nextDue && p.nextDue <= todayStr)
    .sort(([, a], [, b]) => a.nextDue.localeCompare(b.nextDue))
    .slice(0, reviewSlots)
    .map(([slug]) => slug);

  // Unused review slots (no reviews due yet) spill over to new problems
  const unusedReviewSlots = reviewSlots - overdue.length;

  const seen = new Set(Object.keys(problems));
  const newProblems = NC_ORDERED.filter(s => !seen.has(s)).slice(0, newSlots + unusedReviewSlots);

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

// ─── DOM helpers ──────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');

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

  const problems = data.problems || {};
  const settings = { dailyTarget: 5, blendRatio: 0.6, ...(data.settings || {}) };
  const lastActiveDate = data.lastActiveDate || today();

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
  const calData = buildCalData(S.problems);
  const todayStr  = today();
  const todayDate = new Date(todayStr + 'T00:00:00Z');

  // Start from the Sunday 52 full weeks ago
  const start = new Date(todayDate);
  start.setUTCDate(start.getUTCDate() - 52 * 7);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  // Each week column: 11px cell + 2.5px gap ≈ 13.5px stride
  const STRIDE = 13.5; // px per week column
  const WEEKS  = 53;
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // ── Month labels (absolute-positioned, no overlap) ──────────────────────
  const monthsEl = $('cal-months');
  monthsEl.innerHTML = '';
  // Total width = 53 columns × stride
  monthsEl.style.width = (WEEKS * STRIDE) + 'px';

  let lastLabelWeek = -4; // minimum gap of 4 weeks between labels
  let lastMonth = -1;
  const cur = new Date(start);

  for (let w = 0; w < WEEKS; w++) {
    const m = cur.getUTCMonth();
    if (m !== lastMonth && w - lastLabelWeek >= 4) {
      const lbl = document.createElement('span');
      lbl.className = 'cal-month-label';
      lbl.textContent = MONTHS[m];
      lbl.style.left = (w * STRIDE) + 'px';
      monthsEl.appendChild(lbl);
      lastMonth     = m;
      lastLabelWeek = w;
    }
    cur.setUTCDate(cur.getUTCDate() + 7);
  }

  // ── Grid cells ───────────────────────────────────────────────────────────
  const grid = $('cal-grid');
  grid.innerHTML = '';
  const maxCount = Math.max(1, ...Object.values(calData));

  const cur2 = new Date(start);
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const dateStr = cur2.toISOString().split('T')[0];
      const count   = calData[dateStr] || 0;
      const future  = dateStr > todayStr;

      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      if (dateStr === todayStr) cell.classList.add('cal-today');
      if (!future && count > 0) {
        cell.setAttribute('data-level', Math.min(4, Math.ceil((count / maxCount) * 4)));
      }
      if (future) cell.style.opacity = '0.12';
      cell.title = `${dateStr}  ·  ${count} solve${count !== 1 ? 's' : ''}`;
      grid.appendChild(cell);

      cur2.setUTCDate(cur2.getUTCDate() + 1);
    }
  }

  // ── Summary stats ────────────────────────────────────────────────────────
  const counts     = Object.values(calData);
  const totalSolves = counts.reduce((a, b) => a + b, 0);
  const activeDays  = counts.length;
  const bestDay     = Math.max(0, ...counts);

  let streak = 0;
  const d = new Date(todayDate);
  while (calData[d.toISOString().split('T')[0]]) {
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }

  $('cal-total').textContent  = totalSolves;
  $('cal-active').textContent = activeDays;
  $('cal-streak').textContent = streak;
  $('cal-best').textContent   = bestDay;
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
