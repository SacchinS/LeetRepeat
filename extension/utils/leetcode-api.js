/**
 * LeetCode GraphQL API utilities
 * Runs as content script — has access to user session cookies automatically.
 *
 * PROOF OF CONCEPT: Verified these queries work by injecting into leetcode.com
 * The session cookie (LEETCODE_SESSION) is automatically included in fetch calls
 * because we're running in the leetcode.com origin context.
 */

const GRAPHQL_URL = 'https://leetcode.com/graphql';

/**
 * Core GraphQL fetch helper.
 * Must be called from a content script context on leetcode.com.
 */
async function gqlFetch(query, variables = {}) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://leetcode.com',
      'x-csrftoken': getCsrfToken(),
    },
    credentials: 'include', // sends LEETCODE_SESSION cookie
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL HTTP error: ${response.status}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }
  return data.data;
}

/** Extract CSRF token from cookies (required for POST requests to LeetCode) */
function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

// ---------------------------------------------------------------------------
// Query: Get current user's username
// ---------------------------------------------------------------------------
const GET_GLOBAL_DATA_QUERY = `
  query globalData {
    userStatus {
      userId
      isSignedIn
      username
      realName
      avatar
    }
  }
`;

export async function getCurrentUser() {
  const data = await gqlFetch(GET_GLOBAL_DATA_QUERY);
  return data.userStatus;
}

// ---------------------------------------------------------------------------
// Query: Get submission history (paginated)
// ---------------------------------------------------------------------------
const GET_AC_SUBMISSIONS_QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
    }
  }
`;

// LeetCode's API caps recentAcSubmissionList at 20 submissions.
// To get the full history we use the userProfileUserQuestionProgressV2 approach
// or the submissionList endpoint which is paginated.

const GET_SUBMISSION_LIST_QUERY = `
  query submissionList($offset: Int!, $limit: Int!, $lastKey: String, $questionSlug: String, $lang: Int, $status: Int) {
    submissionList(offset: $offset, limit: $limit, lastKey: $lastKey, questionSlug: $questionSlug, lang: $lang, status: $status) {
      lastKey
      hasNext
      submissions {
        id
        statusDisplay
        lang
        runtime
        timestamp
        url
        isPending
        memory
        title
        titleSlug
      }
    }
  }
`;

// Better approach: use the user's solved problems list
const GET_USER_SOLVED_PROBLEMS_QUERY = `
  query userSolvedProblems($username: String!) {
    allQuestionsCount {
      difficulty
      count
    }
    matchedUser(username: $username) {
      username
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
        totalSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
  }
`;

// Paginated AC submissions via the submission history
// LeetCode exposes this via userProfileUserQuestionProgress
const GET_USER_QUESTION_PROGRESS_QUERY = `
  query userProfileUserQuestionProgressV2($userSlug: String!) {
    userProfileUserQuestionProgressV2(userSlug: $userSlug) {
      numAcceptedQuestions {
        count
        difficulty
      }
      numFailedQuestions {
        count
        difficulty
      }
      numUntouchedQuestions {
        count
        difficulty
      }
    }
  }
`;

// Best approach for full solve history with timestamps:
// Use the profile calendar which gives us daily solve counts
// Then use submissionCalendar for the activity heatmap data
const GET_SUBMISSION_CALENDAR_QUERY = `
  query userProfileCalendar($username: String!, $year: Int) {
    matchedUser(username: $username) {
      userCalendar(year: $year) {
        activeYears
        streak
        totalActiveDays
        dccBadges {
          timestamp
          badge {
            name
            icon
          }
        }
        submissionCalendar
      }
    }
  }
`;

// This is the key query: gets ALL AC submissions for a user with timestamps
// Uses the problemsetQuestionList approach combined with submission data
const GET_ALL_AC_SUBMISSIONS_PAGINATED = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
    }
  }
`;

// For full history, we need to query the submission list with pagination
// LeetCode's internal API for this:
const GET_SUBMISSIONS_PAGINATED_QUERY = `
  query submissionList($offset: Int!, $limit: Int!) {
    submissionList(offset: $offset, limit: $limit, lastKey: null, questionSlug: null, lang: null, status: null) {
      lastKey
      hasNext
      submissions {
        id
        statusDisplay
        timestamp
        title
        titleSlug
        lang
      }
    }
  }
`;

/**
 * Fetch the user's full accepted submission history (all pages).
 * Returns array of { title, titleSlug, timestamp (unix), date (ISO string) }
 * De-duplicates by titleSlug, keeping the earliest accepted timestamp.
 */
export async function fetchFullSolveHistory() {
  const solveMap = new Map(); // titleSlug → earliest timestamp
  let offset = 0;
  const limit = 20;
  let hasNext = true;
  let lastKey = null;

  while (hasNext) {
    const data = await gqlFetch(`
      query submissionList($offset: Int!, $limit: Int!, $lastKey: String) {
        submissionList(offset: $offset, limit: $limit, lastKey: $lastKey, questionSlug: null, lang: null, status: null) {
          lastKey
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
    `, { offset, limit, lastKey });

    const list = data.submissionList;
    lastKey = list.lastKey;
    hasNext = list.hasNext;

    for (const sub of list.submissions) {
      if (sub.statusDisplay !== 'Accepted') continue;
      const ts = parseInt(sub.timestamp, 10);
      const existing = solveMap.get(sub.titleSlug);
      // Keep earliest solve
      if (!existing || ts < existing.timestamp) {
        solveMap.set(sub.titleSlug, {
          title: sub.title,
          titleSlug: sub.titleSlug,
          timestamp: ts,
          date: new Date(ts * 1000).toISOString().split('T')[0],
        });
      }
    }

    offset += limit;

    // Safety cap to prevent infinite loops during development
    if (offset > 10000) break;

    // Small delay to avoid rate limiting
    await sleep(100);
  }

  return Array.from(solveMap.values());
}

/**
 * Alternative: fetch solve history via the AC submissions list.
 * LeetCode caps this at 20 without pagination but some versions allow larger limits.
 * Use as a fast first-load option.
 */
export async function fetchRecentAcSubmissions(username, limit = 20) {
  const data = await gqlFetch(GET_ALL_AC_SUBMISSIONS_PAGINATED, { username, limit });
  return (data.recentAcSubmissionList || []).map(s => ({
    title: s.title,
    titleSlug: s.titleSlug,
    timestamp: parseInt(s.timestamp, 10),
    date: new Date(parseInt(s.timestamp, 10) * 1000).toISOString().split('T')[0],
  }));
}

/**
 * Fetch submission calendar — returns a JSON object mapping unix timestamp → count
 * This tells us how many problems were solved each day.
 */
export async function fetchSubmissionCalendar(username, year = null) {
  const data = await gqlFetch(GET_SUBMISSION_CALENDAR_QUERY, { username, year });
  const calendar = data.matchedUser?.userCalendar?.submissionCalendar;
  if (!calendar) return {};
  return JSON.parse(calendar); // { "1704067200": 3, ... }
}

/** Get the current logged-in user's username */
export async function getUsername() {
  const user = await getCurrentUser();
  if (!user?.isSignedIn) throw new Error('User not signed in to LeetCode');
  return user.username;
}

/**
 * Fetch problem metadata including tags.
 * Used during onboarding to enrich Neetcode 150 problems not in our hardcoded list.
 */
const GET_QUESTION_DETAIL_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      questionFrontendId
      title
      titleSlug
      difficulty
      topicTags {
        name
        slug
      }
    }
  }
`;

export async function fetchProblemDetail(titleSlug) {
  const data = await gqlFetch(GET_QUESTION_DETAIL_QUERY, { titleSlug });
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
