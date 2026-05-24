/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Rating → SM-2 quality score:
 *   Easy   → 5
 *   Medium → 3
 *   Hard   → 1
 *
 * Returns updated card state: { interval, easeFactor, repetitions, nextDue }
 */

const RATING_TO_QUALITY = {
  Easy: 5,
  Medium: 3,
  Hard: 1,
};

const MIN_EASE_FACTOR = 1.3;

/**
 * Apply SM-2 to a card given a user rating.
 *
 * @param {object} card - Current card state
 * @param {number} card.interval - Days until next review
 * @param {number} card.easeFactor - EF (starts at 2.5)
 * @param {number} card.repetitions - Number of successful consecutive reviews
 * @param {string} rating - 'Easy' | 'Medium' | 'Hard'
 * @param {string} today - ISO date string (YYYY-MM-DD)
 * @returns {object} Updated card fields
 */
export function applyReview(card, rating, today) {
  const q = RATING_TO_QUALITY[rating];
  if (q === undefined) throw new Error(`Invalid rating: ${rating}`);

  let { interval, easeFactor, repetitions } = card;

  if (q < 3) {
    // Failed recall — reset
    repetitions = 0;
    interval = 1;
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor (SM-2 formula)
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor);

  const nextDue = addDays(today, interval);

  return { interval, easeFactor, repetitions, nextDue };
}

/**
 * Compute the initial card state for a problem based on when it was first solved.
 * Used during onboarding to stagger due dates.
 *
 * @param {string} solvedDate - ISO date when first solved (YYYY-MM-DD)
 * @param {string} today - ISO date string
 * @returns {object} Initial card fields
 */
export function initialCardState(solvedDate, today) {
  const daysSinceSolve = daysBetween(solvedDate, today);

  let interval, dueOffset;

  if (daysSinceSolve >= 730) {
    // 2+ years ago → due now
    interval = 1;
    dueOffset = 0;
  } else if (daysSinceSolve >= 180) {
    // 6-12 months ago → due in 2-4 weeks (random in range)
    interval = randomBetween(14, 28);
    dueOffset = interval;
  } else if (daysSinceSolve >= 30) {
    // ~1-6 months ago → due in 6-8 weeks
    interval = randomBetween(42, 56);
    dueOffset = interval;
  } else {
    // Last month → due in 3-4 months
    interval = randomBetween(90, 120);
    dueOffset = interval;
  }

  return {
    interval,
    easeFactor: 2.5,
    repetitions: 1, // treated as if they successfully reviewed once
    nextDue: addDays(today, dueOffset),
    status: 'review',
  };
}

/**
 * Shift all due dates forward by missedDays.
 * Call this when the user hasn't opened the app for some days.
 *
 * @param {object} problems - { [titleSlug]: problemData }
 * @param {number} missedDays - Number of days missed (integer)
 * @returns {object} Updated problems with shifted due dates
 */
export function shiftDueDates(problems, missedDays) {
  if (missedDays <= 0) return problems;

  const updated = {};
  for (const [slug, problem] of Object.entries(problems)) {
    if (problem.nextDue) {
      updated[slug] = {
        ...problem,
        nextDue: addDays(problem.nextDue, missedDays),
      };
    } else {
      updated[slug] = problem;
    }
  }
  return updated;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function today() {
  return new Date().toISOString().split('T')[0];
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

export function daysBetween(from, to) {
  const a = new Date(from + 'T00:00:00Z');
  const b = new Date(to + 'T00:00:00Z');
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
