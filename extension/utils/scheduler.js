/**
 * Scheduler: due date logic, missed day shifting, blend ratio, new problem selection.
 */

import { today, daysBetween } from './sm2.js';
import { NEETCODE_150, NEETCODE_MAP, TOPIC_ORDER } from './neetcode150.js';

// ─── Due card selection ───────────────────────────────────────────────────────

/**
 * Build today's session queue.
 *
 * @param {object} problems - Full problems map from storage
 * @param {object} settings - { dailyTarget, blendRatio }
 * @returns {{ reviews: string[], newProblems: string[] }} titleSlug arrays
 */
export function buildDailyQueue(problems, settings) {
  const { dailyTarget = 5, blendRatio = 0.6 } = settings;
  const todayStr = today();

  // Raw review slots and new slots (at least 1 of each if target >= 2)
  let reviewSlots = Math.round(dailyTarget * blendRatio);
  let newSlots = dailyTarget - reviewSlots;

  // Guard: always at least 1 new slot if target >= 2
  if (newSlots < 1 && dailyTarget >= 2) {
    newSlots = 1;
    reviewSlots = dailyTarget - newSlots;
  }

  // ─── Collect overdue / due-today reviews ────────────────────────────────
  const overdue = [];
  for (const [slug, p] of Object.entries(problems)) {
    if (p.status !== 'review') continue;
    if (!p.nextDue) continue;
    if (p.nextDue <= todayStr) {
      overdue.push({ slug, nextDue: p.nextDue });
    }
  }

  // Sort: most overdue first
  overdue.sort((a, b) => a.nextDue.localeCompare(b.nextDue));

  const reviews = overdue.slice(0, reviewSlots).map(x => x.slug);

  // ─── New problem slots ────────────────────────────────────────────────────
  const seenSlugs = new Set(Object.keys(problems));
  const newProblems = selectNewProblems(problems, seenSlugs, newSlots, todayStr);

  return { reviews, newProblems };
}

/**
 * Select new problems to suggest, prioritizing:
 * 1. Weak topics (low average SM-2 ease factor)
 * 2. Unseen topics (not yet attempted)
 * 3. Respects loose Neetcode topic ordering
 *
 * @param {object} problems - Problems map (solved problems with history)
 * @param {Set<string>} seenSlugs - Slugs already in deck
 * @param {number} count - How many to pick
 * @returns {string[]} titleSlug array
 */
function selectNewProblems(problems, seenSlugs, count, todayStr) {
  if (count <= 0) return [];

  // Compute per-topic average ease factor (lower = weaker)
  const topicStats = computeTopicStats(problems);

  // Candidates: Neetcode 150 problems not yet in the user's deck
  const candidates = NEETCODE_150.filter(p => !seenSlugs.has(p.titleSlug));

  if (candidates.length === 0) return [];

  // Score each candidate: lower score → higher priority
  // Score = min topic rank (based on TOPIC_ORDER) with weak-topic boost
  const scored = candidates.map(p => {
    const topicRank = Math.min(
      ...p.tags.map(tag => {
        const idx = TOPIC_ORDER.indexOf(tag);
        return idx === -1 ? 999 : idx;
      })
    );

    // Weak topic boost: if user has solved problems in this tag and avg ease < 2.0
    const tagWeakness = p.tags.reduce((worst, tag) => {
      const stats = topicStats[tag];
      if (!stats || stats.count === 0) return worst;
      const avgEase = stats.totalEase / stats.count;
      return Math.min(worst, avgEase);
    }, 2.5);

    // Priority score: lower is better
    // Weak topics (low avgEase) get moved up, otherwise ordered by topic position
    const weaknessBonus = (2.5 - tagWeakness) * 10; // 0–12 range
    const score = topicRank - weaknessBonus;

    return { slug: p.titleSlug, score };
  });

  scored.sort((a, b) => a.score - b.score);

  return scored.slice(0, count).map(x => x.slug);
}

/**
 * Compute per-topic statistics from the user's solved problems.
 * @returns {{ [tag]: { count, totalEase } }}
 */
function computeTopicStats(problems) {
  const stats = {};

  for (const p of Object.values(problems)) {
    if (!p.tags || !p.easeFactor) continue;
    for (const tag of p.tags) {
      if (!stats[tag]) stats[tag] = { count: 0, totalEase: 0 };
      stats[tag].count++;
      stats[tag].totalEase += p.easeFactor;
    }
  }

  return stats;
}

// ─── Missed day handling ──────────────────────────────────────────────────────

/**
 * Calculate how many days have been missed since lastActiveDate.
 * Returns 0 if today or yesterday was the last active date.
 */
export function calcMissedDays(lastActiveDateStr) {
  if (!lastActiveDateStr) return 0;
  const todayStr = today();
  const diff = daysBetween(lastActiveDateStr, todayStr);
  // diff of 0 = same day, diff of 1 = yesterday (no skip), diff of 2+ = missed days
  return Math.max(0, diff - 1);
}

// ─── Weak area summary ────────────────────────────────────────────────────────

/**
 * Returns topics sorted from weakest to strongest, based on average ease factor.
 * Only includes topics with at least 1 solved problem.
 *
 * @returns {Array<{ tag, avgEase, count, avgRating }>}
 */
export function getWeakAreaSummary(problems) {
  const stats = {};

  const EASE_TO_RATING = (ease) => {
    if (ease < 1.8) return 'Hard';
    if (ease < 2.3) return 'Medium';
    return 'Easy';
  };

  for (const p of Object.values(problems)) {
    if (!p.tags || !p.easeFactor || !p.repetitions) continue;
    for (const tag of p.tags) {
      if (!stats[tag]) stats[tag] = { count: 0, totalEase: 0 };
      stats[tag].count++;
      stats[tag].totalEase += p.easeFactor;
    }
  }

  return Object.entries(stats)
    .map(([tag, s]) => ({
      tag,
      avgEase: s.totalEase / s.count,
      count: s.count,
      avgRating: EASE_TO_RATING(s.totalEase / s.count),
    }))
    .sort((a, b) => a.avgEase - b.avgEase); // weakest first
}

// ─── Calendar heatmap data ────────────────────────────────────────────────────

/**
 * Build calendar data for the heatmap from problem history.
 * Returns { [dateStr]: count }
 */
export function buildCalendarData(problems) {
  const calendar = {};
  for (const p of Object.values(problems)) {
    for (const h of (p.history || [])) {
      calendar[h.date] = (calendar[h.date] || 0) + 1;
    }
  }
  return calendar;
}
