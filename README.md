# LeetRepeat 🧠

**Spaced repetition for LeetCode.** Review the right problems at the right time using the SM-2 algorithm — the same system behind Anki.

---

## Features (MVP)

| Feature | Status |
|---|---|
| SM-2 spaced repetition | ✅ |
| Onboarding: import full solve history | ✅ |
| Staggered initial due dates based on age | ✅ |
| Neetcode 150 problem deck | ✅ |
| Missed day shifting | ✅ |
| Daily target + blend ratio | ✅ |
| Submission detection (MutationObserver) | ✅ |
| Easy / Medium / Hard rating modal | ✅ |
| Manual override button | ✅ |
| Dashboard popup | ✅ |
| Today's checklist | ✅ |
| Calendar heatmap | ✅ |
| Weak area summary | ✅ |
| Settings panel | ✅ |

---

## Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `/extension` folder from this repo

The extension icon will appear in your toolbar.

---

## How It Works

### First Install
1. Navigate to any `leetcode.com` page
2. The content script detects you're logged in and begins importing your submission history via LeetCode's GraphQL API (same-origin, no credentials needed)
3. Each solved problem is assigned an initial review date based on when you solved it:
   - Solved 2+ years ago → due **now**
   - Solved 6–12 months ago → due in **2–4 weeks**
   - Solved last month → due in **6–8 weeks**
   - Solved last week → due in **3–4 months**

### Daily Workflow
1. Open the LeetRepeat popup — it shows today's queue (reviews + new problems)
2. Click a problem to open it on LeetCode
3. Solve it — the content script detects "Accepted" automatically
4. A rating modal appears: **Easy / Medium / Hard**
5. SM-2 updates the next due date

### SRS Algorithm
Uses the classic **SM-2** algorithm:
- Easy (q=5) → longer interval, ease factor increases
- Medium (q=3) → standard interval progression
- Hard (q=1) → card resets to day 1

### Missed Days
If you skip days, every card's due date shifts forward by the number of missed days — preserving relative spacing without creating a review avalanche.

---

## File Structure

```
extension/
  manifest.json          # MV3 manifest
  background.js          # Service worker — message routing, alarms
  content.js             # Injected on leetcode.com — onboarding, submission detection, rating modal
  popup/
    index.html           # Dashboard UI
    popup.js             # Checklist, calendar, weak areas, settings
  utils/
    sm2.js               # SM-2 algorithm + date helpers
    scheduler.js         # Queue building, missed day shifting, weak area stats
    leetcode-api.js      # GraphQL queries (used in ES module contexts)
    neetcode150.js       # Full Neetcode 150 list with tags and metadata
    storage.js           # chrome.storage.local helpers
  icons/
    icon16.png
    icon48.png
    icon128.png
```

---

## Data Model

```json
{
  "settings": { "dailyTarget": 5, "blendRatio": 0.6 },
  "lastActiveDate": "2025-05-24",
  "onboarded": true,
  "username": "your-username",
  "problems": {
    "two-sum": {
      "title": "Two Sum",
      "leetcodeId": 1,
      "tags": ["Array", "Hash Table"],
      "leetcodeDifficulty": "Easy",
      "status": "review",
      "interval": 14,
      "easeFactor": 2.5,
      "repetitions": 3,
      "nextDue": "2025-06-07",
      "history": [
        { "date": "2025-01-01", "rating": null },
        { "date": "2025-05-24", "rating": "Medium" }
      ]
    }
  },
  "dailySession": {
    "date": "2025-05-24",
    "queue": ["two-sum", "binary-search"],
    "reviewSlugs": ["two-sum"],
    "newSlugs": ["binary-search"],
    "completed": []
  }
}
```

---

## GraphQL Proof of Concept

The extension's submission fetching was designed around LeetCode's internal GraphQL API at `https://leetcode.com/graphql`. Since the content script runs in the `leetcode.com` origin, it has full access to the user's session cookie (`LEETCODE_SESSION`) automatically — no OAuth or API keys needed.

Key queries:
- `submissionList` — paginated submission history with `statusDisplay`, `timestamp`, `titleSlug`
- `globalData → userStatus` — current user info / login check
- `matchedUser → userCalendar` — activity heatmap data

---

## Post-MVP Roadmap

- Browser notifications for due reviews
- Notes / annotations per problem
- Company-specific problem targeting
- Cross-device sync
- Export / import JSON
- Daily streaks
- LeetCode Premium problem support
