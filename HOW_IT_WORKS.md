# How LeetRepeat Works

A plain-English walkthrough of every piece of the extension.

---

## First: what is a "slug"?

A slug is the URL-friendly version of a name. LeetCode uses them in their URLs:

```
https://leetcode.com/problems/two-sum/
                              ^^^^^^^^
                              this is the slug
```

The problem title is "Two Sum". The slug is `two-sum` — lowercase, spaces replaced with dashes. Slugs are what LeetCode uses internally to identify problems, so we use them as the key in our data too. Whenever you see `titleSlug` in the code, it just means "the problem's URL name."

---

## The Big Picture

When you install LeetRepeat, three separate programs start working together:

```
┌─────────────────────────────────────────────────────────┐
│  Your Browser                                           │
│                                                         │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │ background  │    │  content     │    │  popup    │  │
│  │   .js       │◄──►│  script      │◄──►│  (the     │  │
│  │ (invisible) │    │  (leetcode   │    │   button) │  │
│  │             │    │   .com only) │    │           │  │
│  └─────────────┘    └──────────────┘    └───────────┘  │
│         │                  │                   │        │
│         └──────────────────┴───────────────────┘        │
│                            │                            │
│                    chrome.storage.local                 │
│                    (the shared database)                │
└─────────────────────────────────────────────────────────┘
```

Each piece has one job. They talk to each other by reading/writing to the same storage, and by sending messages.

---

## The Three Programs

### 1. `background.js` — The Silent Manager

This is a **service worker**: a background script that Chrome runs invisibly. You never see it. It:

- Wakes up when the extension is installed (sets up a daily alarm)
- Acts as a **message relay** — when the content script or popup want to read/write storage, they send a message to background.js and it does it
- Goes to sleep when nothing is happening (this is how MV3 works — no always-on background pages)

Think of it like a bank teller. You (the popup or content script) hand it a slip of paper ("please save this data"), it does the transaction, and hands back a receipt.

---

### 2. `content.js` — The LeetCode Watcher

This script is **injected directly into leetcode.com pages** by Chrome. It runs inside the LeetCode website itself, which gives it two superpowers:

**Superpower 1: Access to your login cookies**
When you're logged into LeetCode, your browser holds a secret token called a session cookie (`LEETCODE_SESSION`). Any code running on the leetcode.com domain automatically has this cookie attached to its requests. That's why the extension can fetch your private submission history — it's making the same request your browser would make, with your login attached.

**Superpower 2: It can see and modify the page**
It can watch for changes to the page and inject new HTML (like the rating modal).

#### What content.js does on first install: Onboarding

1. Asks LeetCode: "who is logged in?" (`userStatus` query)
2. If signed in, starts fetching your entire submission history page by page (`submissionList` query, 20 at a time)
3. For each accepted submission, records the problem slug and the date you solved it
4. Removes duplicates — keeps only the **earliest** solve date per problem (that's when you first learned it)
5. For each solved problem, calculates how long ago you solved it and assigns a starting due date (more on this in the SM-2 section)
6. Saves everything to `chrome.storage.local`

#### What content.js does every time you solve a problem

1. Watches the page using a `MutationObserver` — this is a built-in browser tool that fires a callback whenever the page's HTML changes
2. When it detects the word "Accepted" appearing in a result area, it knows you just solved the problem
3. It pops up the rating modal (Easy / Medium / Hard)
4. When you pick a rating, it runs the SM-2 algorithm and saves your updated schedule

---

### 3. `popup/` — The Dashboard

This is the UI you see when you click the extension icon. It's just an HTML page (`index.html`) with a JavaScript file (`popup.js`) that:

1. Reads all your data from `chrome.storage.local`
2. Checks if you've been away (missed days)
3. Builds today's queue (which problems to review + which new ones to try)
4. Renders the checklist, calendar heatmap, weak areas, and settings

The popup has **no direct connection to LeetCode** — it only talks to storage. All the LeetCode API calls happen in content.js.

---

## The Shared Database: `chrome.storage.local`

All three programs read and write to the same place. Think of it as a JSON file that lives in your Chrome profile. Here's what's in it:

```
chrome.storage.local
│
├── onboarded: true                  ← has the import run yet?
├── username: "S2530"                ← your LeetCode username
├── lastActiveDate: "2026-05-24"     ← when you last opened the popup
│
├── settings:
│   ├── dailyTarget: 5               ← how many problems per day
│   └── blendRatio: 0.6              ← 60% reviews, 40% new
│
├── dailySession:
│   ├── date: "2026-05-24"           ← today's date
│   ├── queue: ["two-sum", ...]      ← today's problem list (slugs)
│   ├── reviewSlugs: ["two-sum"]     ← which ones are reviews
│   ├── newSlugs: ["binary-search"]  ← which ones are new
│   └── completed: []                ← which ones you've checked off
│
└── problems:
    ├── "two-sum": { ... }           ← one entry per problem you've touched
    ├── "binary-search": { ... }
    └── ...
```

Each problem entry looks like this:

```json
{
  "title": "Two Sum",
  "titleSlug": "two-sum",
  "tags": ["Array", "Hash Table"],
  "leetcodeDifficulty": "Easy",
  "status": "review",
  "interval": 14,
  "easeFactor": 2.5,
  "repetitions": 3,
  "nextDue": "2026-06-07",
  "history": [
    { "date": "2025-10-08", "rating": null },
    { "date": "2026-05-24", "rating": "Medium" }
  ]
}
```

- `interval` — how many days until you see it again
- `easeFactor` — a multiplier that grows when you find things easy, shrinks when you struggle (starts at 2.5)
- `repetitions` — how many times you've successfully reviewed it
- `nextDue` — the date it should show up again
- `history` — a log of every time you rated it (first entry has `null` rating because onboarding just imports the date, not a rating)

---

## The SM-2 Algorithm

SM-2 is the math behind Anki and most spaced repetition apps. It decides how long to wait before showing you a problem again.

### The idea

If you find something easy, you should see it less often — you clearly know it. If you struggle, you see it again soon. The interval between reviews grows exponentially as you keep succeeding.

### How it works in LeetRepeat

You rate yourself after every solve: **Easy**, **Medium**, or **Hard**. These map to quality scores:

| Your rating | Quality score (q) |
|-------------|------------------|
| Easy        | 5                |
| Medium      | 3                |
| Hard        | 1                |

Then the algorithm runs:

**If you rated Hard (q < 3):**
- You basically forgot it. Reset: `interval = 1 day`, `repetitions = 0`

**If you rated Medium or Easy (q ≥ 3):**
- `repetitions = 0` (first time): interval = 1 day
- `repetitions = 1` (second time): interval = 6 days  
- `repetitions = 2+`: interval = previous interval × easeFactor

**Then the ease factor updates:**
```
easeFactor = easeFactor + 0.1 - (5 - q) × (0.08 + (5 - q) × 0.02)
```

In plain English: rating Easy makes it grow (you'll wait longer next time), rating Hard makes it shrink (you'll see it sooner). It never goes below 1.3.

### Example walkthrough

You solve Two Sum for the first time and rate it **Easy**:
- interval → 1 day, easeFactor → 2.6, repetitions → 1, nextDue → tomorrow

You see it tomorrow and rate it **Easy** again:
- interval → 6 days, easeFactor → 2.7, repetitions → 2, nextDue → 6 days from now

Six days later, rate it **Medium**:
- interval → 6 × 2.7 = 16 days, easeFactor stays at 2.6 (slight decrease), repetitions → 3

Sixteen days later, rate it **Hard**:
- Reset: interval → 1 day, easeFactor drops to ~2.4, repetitions → 0

You'll see it again tomorrow and start climbing the ladder again.

---

## Onboarding: Staggering Initial Due Dates

When you first install, LeetRepeat imports 152 problems (or however many you've solved). It can't just set them all due today — that would be overwhelming. Instead it looks at **when you first solved each problem** and uses that to guess how well you remember it now:

| You solved it... | Assumed memory | Initial due date |
|-----------------|----------------|-----------------|
| 2+ years ago | Probably forgotten | Due now |
| 6–12 months ago | Fading | Due in 2–4 weeks |
| 1–6 months ago | Somewhat remember | Due in 6–8 weeks |
| Last month | Probably still fresh | Due in 3–4 months |

This creates a natural trickle of reviews rather than an avalanche on day one.

---

## Daily Queue: What Shows Up Each Day

Every time you open the popup, it runs this logic:

**Step 1: Check for missed days**
If you haven't opened the app in 3 days, every card's due date shifts forward by 3 days. This is intentional — it means you never come back to a 3-day backlog. Your schedule just picks up where you left off, spacing preserved.

**Step 2: Apply your settings**
Default: 5 problems/day, 60% reviews, 40% new.
That means: 3 review slots + 2 new problem slots.

**Step 3: Fill review slots**
Look for problems where `nextDue <= today`. Sort by most overdue first. Take the first 3 (or however many review slots you have).

**Step 4: Fill new problem slots**
Pull from the Neetcode 150 list, in order, skipping any problem already in your deck. Prioritize topics where your ease factor is low (you struggle there).

**New slots are never eliminated.** Even if you have 50 overdue reviews, at least 1 slot is always reserved for a new problem. This keeps you making forward progress.

---

## The Neetcode 150

This is a curated list of 150 LeetCode problems that cover all the major interview topics, organized from foundational to advanced:

```
Arrays & Hashing → Two Pointers → Sliding Window → Stack →
Binary Search → Linked List → Trees → Tries →
Heap → Backtracking → Graphs → Advanced Graphs →
1D DP → 2D DP → Greedy → Intervals → Math → Bit Manipulation
```

The list is hardcoded in `utils/neetcode150.js`. Each problem has:
- Its LeetCode ID and slug
- Its difficulty (Easy/Medium/Hard) — used only for display, never for scheduling
- Its topic tags — used for the weak area analysis

When suggesting new problems, LeetRepeat walks this list in order (Arrays first, Bit Manipulation last), with a boost for topics where you've been struggling.

---

## The GraphQL API

LeetCode's website talks to its own backend using GraphQL — a query language where you ask for exactly the fields you want. LeetRepeat makes the same kind of requests your browser makes when you visit the site.

The endpoint is: `https://leetcode.com/graphql`

We send a POST request with a JSON body like:
```json
{
  "query": "query submissionList($offset: Int!, $limit: Int!) { submissionList(offset: $offset, limit: $limit) { hasNext submissions { title titleSlug statusDisplay timestamp } } }",
  "variables": { "offset": 0, "limit": 20 }
}
```

LeetCode responds with:
```json
{
  "data": {
    "submissionList": {
      "hasNext": true,
      "submissions": [
        { "title": "Two Sum", "titleSlug": "two-sum", "statusDisplay": "Accepted", "timestamp": "1776039589" },
        ...
      ]
    }
  }
}
```

`timestamp` is a Unix timestamp — the number of seconds since January 1, 1970. We convert it to a readable date: `new Date(timestamp * 1000).toISOString().split('T')[0]` → `"2026-04-13"`.

**Why does this work without an API key?**
Because the content script runs inside the `leetcode.com` domain, the browser automatically attaches your session cookies to every request — the same way your browser does when you load any LeetCode page. LeetCode sees the request as coming from you, logged in.

**Pagination:**
LeetCode returns 20 submissions at a time. We keep incrementing `offset` by 20 until `hasNext` is `false`. For 700 total submissions (your account), that's 35 pages × 20 = 700, taking about 4 seconds with a 120ms delay between pages.

---

## The Submission Detector

On any `leetcode.com/problems/...` page, `content.js` sets up a `MutationObserver`. This is a standard browser API that watches for HTML changes and fires a callback when something changes.

LeetCode is a single-page app built in React — when you submit code and it gets accepted, React updates the DOM (the page's HTML structure) to show the result. Our observer watches for the word "Accepted" appearing in a result-area element.

When it fires:
1. We grab the slug from the URL (`/problems/two-sum/` → `two-sum`)
2. Wait 800ms for the DOM to fully settle
3. Show the rating modal

The **manual button** (the blue "⟳ LeetRepeat" button fixed to the bottom-right corner of problem pages) is a fallback in case the observer misses the trigger — for example, if LeetCode changes their HTML structure and the observer no longer matches. Clicking it manually shows the same modal.

---

## The Utility Files

These are helper libraries used by the main files:

| File | What it does |
|------|-------------|
| `utils/sm2.js` | The SM-2 math. Given a card and a rating, returns the new interval, ease factor, and next due date. Also has date helpers (addDays, daysBetween). |
| `utils/scheduler.js` | Builds the daily queue. Picks which reviews are due, which new problems to suggest, computes weak areas, and builds the calendar heatmap data. |
| `utils/neetcode150.js` | The hardcoded list of 150 problems with their slugs, difficulties, and topic tags. |
| `utils/storage.js` | Wrappers around `chrome.storage.local` so other files don't have to write callback boilerplate every time they read or write data. |
| `utils/leetcode-api.js` | The three working GraphQL queries wrapped in clean functions: `getCurrentUser()`, `fetchFullSolveHistory()`, `fetchSubmissionCalendar()`, `fetchProblemDetail()`. |

> **Note:** The `utils/` files are written as ES modules (they use `import`/`export`). They're meant to be used in the popup (via script tags) or in a future build step. The content script and popup currently inline the logic they need because Chrome's content script environment doesn't support ES module imports without a bundler like webpack.

---

## MV3 Compliance

Chrome Manifest V3 has stricter rules than the older MV2:

| Rule | How we follow it |
|------|-----------------|
| No persistent background page | `background.js` is a service worker — Chrome can shut it down when idle |
| No memory state | Everything is saved to `chrome.storage.local` immediately. If the service worker restarts, nothing is lost. |
| No `eval()` or dynamic code | All logic is static code in files |
| Declared permissions only | `manifest.json` declares: `storage`, `alarms`, `tabs`, and host access to `https://leetcode.com/*` |

---

## Flow Diagrams

### First install
```
Install extension
      ↓
User visits leetcode.com
      ↓
content.js runs → checks storage: "am I onboarded?"
      ↓ (no)
Fetch current user from GraphQL
      ↓
Is user signed in?
  → No: show banner "please sign in", stop
  → Yes: start fetching submission history
      ↓
Loop: fetch 20 submissions at a time (offset=0, 20, 40...)
Filter for "Accepted", deduplicate by slug, keep earliest date
      ↓
For each solved problem: calculate initial due date based on age
      ↓
Save all problems to chrome.storage.local
Set onboarded = true
      ↓
Show banner: "Import complete! Open the popup."
```

### Every day you open the popup
```
Popup opens
      ↓
Load everything from chrome.storage.local
      ↓
How many days since lastActiveDate?
  → 0-1 days: no action
  → 2+ days: shift ALL nextDue dates forward by missedDays
      ↓
Set lastActiveDate = today
      ↓
Build daily queue:
  - Reviews: problems where nextDue <= today (most overdue first)
  - New: next unseen Neetcode 150 problems
  - Cap at dailyTarget (default 5), split by blendRatio (default 60/40)
      ↓
Render checklist, stats, calendar, weak areas
```

### Every time you solve a problem
```
You submit code on leetcode.com/problems/two-sum/
      ↓
content.js MutationObserver fires when "Accepted" appears
      ↓
Wait 800ms (DOM settles)
      ↓
Show rating modal: Easy / Medium / Hard
      ↓
You click "Medium"
      ↓
Load current problem data from storage
Run SM-2: calculate new interval, easeFactor, nextDue
Append { date: today, rating: "Medium" } to problem.history
Save updated problem to storage
      ↓
Show toast: "Rated Medium — schedule updated!"
```
