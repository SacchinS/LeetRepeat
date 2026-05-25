/**
 * LeetCode GraphQL API utilities
 * Runs as content script — session cookie is automatically included.
 *
 * VERIFIED WORKING queries (tested 2025-05-24 against production leetcode.com):
 *   ✅ userStatus                  — auth check, get username
 *   ✅ submissionList(offset, limit) — offset-based pagination; lastKey is always null
 *   ✅ recentAcSubmissionList(username, limit) — AC-only list; limit=100 confirmed working
 *   ✅ matchedUser.userCalendar    — submissionCalendar heatmap JSON
 *   ✅ question(titleSlug)         — problem metadata + tags
 *
 * NOT WORKING (400 Bad Request):
 *   ❌ submissionList with extra null args (questionSlug, lang, status) — omit them
 *   ❌ userProgressQuestionList    — query doesn't exist
 *   ❌ problemsetQuestionList with status filter — wrong arg types
 */

const GRAPHQL_URL = 'https://leetcode.com/graphql';

function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

export async function gqlFetch(query, variables = {}) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://leetcode.com',
      'x-csrftoken': getCsrfToken(),
    },
    credentials: 'include',
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`GraphQL HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }
  return data.data;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Returns { isSignedIn, username } or throws.
 */
export async function getCurrentUser() {
  const data = await gqlFetch(`
    query globalData {
      userStatus {
        isSignedIn
        username
      }
    }
  `);
  return data.userStatus;
}

// ---------------------------------------------------------------------------
// Submission history — offset-based pagination
//
// IMPORTANT: Do NOT add questionSlug/lang/status args — they cause a 400.
// lastKey in the response is always null; pagination is purely offset-based.
// ---------------------------------------------------------------------------

/**
 * Fetch the user's full accepted submission history across all pages.
 * Returns Map<titleSlug, { title, titleSlug, timestamp, date }>
 * Keeps the EARLIEST accepted timestamp per problem (= first solve date).
 *
 * @param {function} [onProgress] - called with (uniqueSolveCount, pageNum) each page
 */
export async function fetchFullSolveHistory(onProgress) {
  const solveMap = new Map();
  let offset = 0;
  const limit = 20;
  let hasNext = true;
  let pageCount = 0;

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
      // Keep earliest solve date
      if (!existing || ts < existing.timestamp) {
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
    if (offset > 20000) break; // safety cap (~1000 pages)

    await sleep(120); // be polite to LeetCode's servers
  }

  return Array.from(solveMap.values());
}

// ---------------------------------------------------------------------------
// Submission calendar — heatmap data
// ---------------------------------------------------------------------------

/**
 * Fetch the submission calendar for a given year (or current year if null).
 * Returns plain object: { "1704067200": 3, ... }  (unix timestamp → count)
 * Keys are midnight UTC timestamps, values are total submissions that day.
 */
export async function fetchSubmissionCalendar(username, year = null) {
  const data = await gqlFetch(`
    query userCalendar($username: String!, $year: Int) {
      matchedUser(username: $username) {
        userCalendar(year: $year) {
          submissionCalendar
          activeYears
        }
      }
    }
  `, { username, year });

  const calendar = data.matchedUser?.userCalendar?.submissionCalendar;
  if (!calendar) return {};
  return JSON.parse(calendar);
}

// ---------------------------------------------------------------------------
// Problem metadata
// ---------------------------------------------------------------------------

/**
 * Fetch full metadata for a problem by its URL slug.
 * Returns { leetcodeId, title, titleSlug, difficulty, tags: string[] }
 */
export async function fetchProblemDetail(titleSlug) {
  const data = await gqlFetch(`
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionFrontendId
        title
        titleSlug
        difficulty
        topicTags { name }
      }
    }
  `, { titleSlug });

  const q = data.question;
  if (!q) return null;
  return {
    leetcodeId: parseInt(q.questionFrontendId, 10),
    title: q.title,
    titleSlug: q.titleSlug,
    difficulty: q.difficulty,
    tags: q.topicTags.map(t => t.name),
  };
}
