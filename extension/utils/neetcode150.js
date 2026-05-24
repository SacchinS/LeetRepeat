/**
 * Neetcode 150 problem list.
 * Ordered with topic progression (foundational topics first).
 * Source: neetcode.io/practice
 */

export const NEETCODE_150 = [
  // ─── Arrays & Hashing ──────────────────────────────────────────────────────
  { titleSlug: 'contains-duplicate', title: 'Contains Duplicate', leetcodeId: 217, difficulty: 'Easy', tags: ['Array', 'Hash Table', 'Sorting'] },
  { titleSlug: 'valid-anagram', title: 'Valid Anagram', leetcodeId: 242, difficulty: 'Easy', tags: ['Hash Table', 'String', 'Sorting'] },
  { titleSlug: 'two-sum', title: 'Two Sum', leetcodeId: 1, difficulty: 'Easy', tags: ['Array', 'Hash Table'] },
  { titleSlug: 'group-anagrams', title: 'Group Anagrams', leetcodeId: 49, difficulty: 'Medium', tags: ['Array', 'Hash Table', 'String', 'Sorting'] },
  { titleSlug: 'top-k-frequent-elements', title: 'Top K Frequent Elements', leetcodeId: 347, difficulty: 'Medium', tags: ['Array', 'Hash Table', 'Divide and Conquer', 'Sorting', 'Heap (Priority Queue)', 'Bucket Sort', 'Counting', 'Quickselect'] },
  { titleSlug: 'product-of-array-except-self', title: 'Product of Array Except Self', leetcodeId: 238, difficulty: 'Medium', tags: ['Array', 'Prefix Sum'] },
  { titleSlug: 'valid-sudoku', title: 'Valid Sudoku', leetcodeId: 36, difficulty: 'Medium', tags: ['Array', 'Hash Table', 'Matrix'] },
  { titleSlug: 'encode-and-decode-strings', title: 'Encode and Decode Strings', leetcodeId: 271, difficulty: 'Medium', tags: ['Array', 'String', 'Design'] },
  { titleSlug: 'longest-consecutive-sequence', title: 'Longest Consecutive Sequence', leetcodeId: 128, difficulty: 'Medium', tags: ['Array', 'Hash Table', 'Union Find'] },

  // ─── Two Pointers ──────────────────────────────────────────────────────────
  { titleSlug: 'valid-palindrome', title: 'Valid Palindrome', leetcodeId: 125, difficulty: 'Easy', tags: ['Two Pointers', 'String'] },
  { titleSlug: 'two-sum-ii-input-array-is-sorted', title: 'Two Sum II - Input Array Is Sorted', leetcodeId: 167, difficulty: 'Medium', tags: ['Array', 'Two Pointers', 'Binary Search'] },
  { titleSlug: '3sum', title: '3Sum', leetcodeId: 15, difficulty: 'Medium', tags: ['Array', 'Two Pointers', 'Sorting'] },
  { titleSlug: 'container-with-most-water', title: 'Container With Most Water', leetcodeId: 11, difficulty: 'Medium', tags: ['Array', 'Two Pointers', 'Greedy'] },
  { titleSlug: 'trapping-rain-water', title: 'Trapping Rain Water', leetcodeId: 42, difficulty: 'Hard', tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack', 'Monotonic Stack'] },

  // ─── Sliding Window ────────────────────────────────────────────────────────
  { titleSlug: 'best-time-to-buy-and-sell-stock', title: 'Best Time to Buy and Sell Stock', leetcodeId: 121, difficulty: 'Easy', tags: ['Array', 'Dynamic Programming'] },
  { titleSlug: 'longest-substring-without-repeating-characters', title: 'Longest Substring Without Repeating Characters', leetcodeId: 3, difficulty: 'Medium', tags: ['Hash Table', 'String', 'Sliding Window'] },
  { titleSlug: 'longest-repeating-character-replacement', title: 'Longest Repeating Character Replacement', leetcodeId: 424, difficulty: 'Medium', tags: ['Hash Table', 'String', 'Sliding Window'] },
  { titleSlug: 'permutation-in-string', title: 'Permutation in String', leetcodeId: 567, difficulty: 'Medium', tags: ['Hash Table', 'Two Pointers', 'String', 'Sliding Window'] },
  { titleSlug: 'minimum-window-substring', title: 'Minimum Window Substring', leetcodeId: 76, difficulty: 'Hard', tags: ['Hash Table', 'String', 'Sliding Window'] },
  { titleSlug: 'sliding-window-maximum', title: 'Sliding Window Maximum', leetcodeId: 239, difficulty: 'Hard', tags: ['Array', 'Queue', 'Sliding Window', 'Heap (Priority Queue)', 'Monotonic Queue'] },

  // ─── Stack ─────────────────────────────────────────────────────────────────
  { titleSlug: 'valid-parentheses', title: 'Valid Parentheses', leetcodeId: 20, difficulty: 'Easy', tags: ['String', 'Stack'] },
  { titleSlug: 'min-stack', title: 'Min Stack', leetcodeId: 155, difficulty: 'Medium', tags: ['Stack', 'Design'] },
  { titleSlug: 'evaluate-reverse-polish-notation', title: 'Evaluate Reverse Polish Notation', leetcodeId: 150, difficulty: 'Medium', tags: ['Array', 'Math', 'Stack'] },
  { titleSlug: 'generate-parentheses', title: 'Generate Parentheses', leetcodeId: 22, difficulty: 'Medium', tags: ['String', 'Dynamic Programming', 'Backtracking'] },
  { titleSlug: 'daily-temperatures', title: 'Daily Temperatures', leetcodeId: 739, difficulty: 'Medium', tags: ['Array', 'Stack', 'Monotonic Stack'] },
  { titleSlug: 'car-fleet', title: 'Car Fleet', leetcodeId: 853, difficulty: 'Medium', tags: ['Array', 'Stack', 'Sorting', 'Monotonic Stack'] },
  { titleSlug: 'largest-rectangle-in-histogram', title: 'Largest Rectangle in Histogram', leetcodeId: 84, difficulty: 'Hard', tags: ['Array', 'Stack', 'Monotonic Stack'] },

  // ─── Binary Search ─────────────────────────────────────────────────────────
  { titleSlug: 'binary-search', title: 'Binary Search', leetcodeId: 704, difficulty: 'Easy', tags: ['Array', 'Binary Search'] },
  { titleSlug: 'search-a-2d-matrix', title: 'Search a 2D Matrix', leetcodeId: 74, difficulty: 'Medium', tags: ['Array', 'Binary Search', 'Matrix'] },
  { titleSlug: 'koko-eating-bananas', title: 'Koko Eating Bananas', leetcodeId: 875, difficulty: 'Medium', tags: ['Array', 'Binary Search'] },
  { titleSlug: 'find-minimum-in-rotated-sorted-array', title: 'Find Minimum in Rotated Sorted Array', leetcodeId: 153, difficulty: 'Medium', tags: ['Array', 'Binary Search'] },
  { titleSlug: 'search-in-rotated-sorted-array', title: 'Search in Rotated Sorted Array', leetcodeId: 33, difficulty: 'Medium', tags: ['Array', 'Binary Search'] },
  { titleSlug: 'time-based-key-value-store', title: 'Time Based Key-Value Store', leetcodeId: 981, difficulty: 'Medium', tags: ['Hash Table', 'String', 'Binary Search', 'Design'] },
  { titleSlug: 'median-of-two-sorted-arrays', title: 'Median of Two Sorted Arrays', leetcodeId: 4, difficulty: 'Hard', tags: ['Array', 'Binary Search', 'Divide and Conquer'] },

  // ─── Linked List ───────────────────────────────────────────────────────────
  { titleSlug: 'reverse-linked-list', title: 'Reverse Linked List', leetcodeId: 206, difficulty: 'Easy', tags: ['Linked List', 'Recursion'] },
  { titleSlug: 'merge-two-sorted-lists', title: 'Merge Two Sorted Lists', leetcodeId: 21, difficulty: 'Easy', tags: ['Linked List', 'Recursion'] },
  { titleSlug: 'reorder-list', title: 'Reorder List', leetcodeId: 143, difficulty: 'Medium', tags: ['Linked List', 'Two Pointers', 'Stack', 'Recursion'] },
  { titleSlug: 'remove-nth-node-from-end-of-list', title: 'Remove Nth Node From End of List', leetcodeId: 19, difficulty: 'Medium', tags: ['Linked List', 'Two Pointers'] },
  { titleSlug: 'copy-list-with-random-pointer', title: 'Copy List with Random Pointer', leetcodeId: 138, difficulty: 'Medium', tags: ['Hash Table', 'Linked List'] },
  { titleSlug: 'add-two-numbers', title: 'Add Two Numbers', leetcodeId: 2, difficulty: 'Medium', tags: ['Linked List', 'Math', 'Recursion'] },
  { titleSlug: 'linked-list-cycle', title: 'Linked List Cycle', leetcodeId: 141, difficulty: 'Easy', tags: ['Hash Table', 'Linked List', 'Two Pointers'] },
  { titleSlug: 'find-the-duplicate-number', title: 'Find the Duplicate Number', leetcodeId: 287, difficulty: 'Medium', tags: ['Array', 'Two Pointers', 'Binary Search', 'Bit Manipulation'] },
  { titleSlug: 'lru-cache', title: 'LRU Cache', leetcodeId: 146, difficulty: 'Medium', tags: ['Hash Table', 'Linked List', 'Design', 'Doubly-Linked List'] },
  { titleSlug: 'merge-k-sorted-lists', title: 'Merge k Sorted Lists', leetcodeId: 23, difficulty: 'Hard', tags: ['Linked List', 'Divide and Conquer', 'Heap (Priority Queue)', 'Merge Sort'] },
  { titleSlug: 'reverse-nodes-in-k-group', title: 'Reverse Nodes in k-Group', leetcodeId: 25, difficulty: 'Hard', tags: ['Linked List', 'Recursion'] },

  // ─── Trees ─────────────────────────────────────────────────────────────────
  { titleSlug: 'invert-binary-tree', title: 'Invert Binary Tree', leetcodeId: 226, difficulty: 'Easy', tags: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'] },
  { titleSlug: 'maximum-depth-of-binary-tree', title: 'Maximum Depth of Binary Tree', leetcodeId: 104, difficulty: 'Easy', tags: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'] },
  { titleSlug: 'diameter-of-binary-tree', title: 'Diameter of Binary Tree', leetcodeId: 543, difficulty: 'Easy', tags: ['Tree', 'Depth-First Search', 'Binary Tree'] },
  { titleSlug: 'balanced-binary-tree', title: 'Balanced Binary Tree', leetcodeId: 110, difficulty: 'Easy', tags: ['Tree', 'Depth-First Search', 'Binary Tree'] },
  { titleSlug: 'same-tree', title: 'Same Tree', leetcodeId: 100, difficulty: 'Easy', tags: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'] },
  { titleSlug: 'subtree-of-another-tree', title: 'Subtree of Another Tree', leetcodeId: 572, difficulty: 'Easy', tags: ['Tree', 'Depth-First Search', 'String Matching', 'Binary Tree', 'Hash Function'] },
  { titleSlug: 'lowest-common-ancestor-of-a-binary-search-tree', title: 'Lowest Common Ancestor of a Binary Search Tree', leetcodeId: 235, difficulty: 'Medium', tags: ['Tree', 'Depth-First Search', 'Binary Search Tree', 'Binary Tree'] },
  { titleSlug: 'binary-tree-level-order-traversal', title: 'Binary Tree Level Order Traversal', leetcodeId: 102, difficulty: 'Medium', tags: ['Tree', 'Breadth-First Search', 'Binary Tree'] },
  { titleSlug: 'binary-tree-right-side-view', title: 'Binary Tree Right Side View', leetcodeId: 199, difficulty: 'Medium', tags: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'] },
  { titleSlug: 'count-good-nodes-in-binary-tree', title: 'Count Good Nodes in Binary Tree', leetcodeId: 1448, difficulty: 'Medium', tags: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'] },
  { titleSlug: 'validate-binary-search-tree', title: 'Validate Binary Search Tree', leetcodeId: 98, difficulty: 'Medium', tags: ['Tree', 'Depth-First Search', 'Binary Search Tree', 'Binary Tree'] },
  { titleSlug: 'kth-smallest-element-in-a-bst', title: 'Kth Smallest Element in a BST', leetcodeId: 230, difficulty: 'Medium', tags: ['Tree', 'Depth-First Search', 'Binary Search Tree', 'Binary Tree'] },
  { titleSlug: 'construct-binary-tree-from-preorder-and-inorder-traversal', title: 'Construct Binary Tree from Preorder and Inorder Traversal', leetcodeId: 105, difficulty: 'Medium', tags: ['Array', 'Hash Table', 'Divide and Conquer', 'Tree', 'Binary Tree'] },
  { titleSlug: 'binary-tree-maximum-path-sum', title: 'Binary Tree Maximum Path Sum', leetcodeId: 124, difficulty: 'Hard', tags: ['Dynamic Programming', 'Tree', 'Depth-First Search', 'Binary Tree'] },
  { titleSlug: 'serialize-and-deserialize-binary-tree', title: 'Serialize and Deserialize Binary Tree', leetcodeId: 297, difficulty: 'Hard', tags: ['String', 'Tree', 'Depth-First Search', 'Breadth-First Search', 'Design', 'Binary Tree'] },

  // ─── Tries ─────────────────────────────────────────────────────────────────
  { titleSlug: 'implement-trie-prefix-tree', title: 'Implement Trie (Prefix Tree)', leetcodeId: 208, difficulty: 'Medium', tags: ['Hash Table', 'String', 'Design', 'Trie'] },
  { titleSlug: 'design-add-and-search-words-data-structure', title: 'Design Add and Search Words Data Structure', leetcodeId: 211, difficulty: 'Medium', tags: ['String', 'Depth-First Search', 'Design', 'Trie'] },
  { titleSlug: 'word-search-ii', title: 'Word Search II', leetcodeId: 212, difficulty: 'Hard', tags: ['Array', 'String', 'Backtracking', 'Trie', 'Matrix'] },

  // ─── Heap / Priority Queue ─────────────────────────────────────────────────
  { titleSlug: 'kth-largest-element-in-a-stream', title: 'Kth Largest Element in a Stream', leetcodeId: 703, difficulty: 'Easy', tags: ['Tree', 'Design', 'Binary Search Tree', 'Heap (Priority Queue)', 'Binary Tree', 'Data Stream'] },
  { titleSlug: 'last-stone-weight', title: 'Last Stone Weight', leetcodeId: 1046, difficulty: 'Easy', tags: ['Array', 'Heap (Priority Queue)'] },
  { titleSlug: 'k-closest-points-to-origin', title: 'K Closest Points to Origin', leetcodeId: 973, difficulty: 'Medium', tags: ['Array', 'Math', 'Divide and Conquer', 'Geometry', 'Sorting', 'Heap (Priority Queue)', 'Quickselect'] },
  { titleSlug: 'kth-largest-element-in-an-array', title: 'Kth Largest Element in an Array', leetcodeId: 215, difficulty: 'Medium', tags: ['Array', 'Divide and Conquer', 'Sorting', 'Heap (Priority Queue)', 'Quickselect'] },
  { titleSlug: 'task-scheduler', title: 'Task Scheduler', leetcodeId: 621, difficulty: 'Medium', tags: ['Array', 'Hash Table', 'Greedy', 'Sorting', 'Heap (Priority Queue)', 'Counting'] },
  { titleSlug: 'design-twitter', title: 'Design Twitter', leetcodeId: 355, difficulty: 'Medium', tags: ['Hash Table', 'Linked List', 'Design', 'Heap (Priority Queue)'] },
  { titleSlug: 'find-median-from-data-stream', title: 'Find Median from Data Stream', leetcodeId: 295, difficulty: 'Hard', tags: ['Two Pointers', 'Design', 'Sorting', 'Heap (Priority Queue)', 'Data Stream'] },

  // ─── Backtracking ──────────────────────────────────────────────────────────
  { titleSlug: 'subsets', title: 'Subsets', leetcodeId: 78, difficulty: 'Medium', tags: ['Array', 'Backtracking', 'Bit Manipulation'] },
  { titleSlug: 'combination-sum', title: 'Combination Sum', leetcodeId: 39, difficulty: 'Medium', tags: ['Array', 'Backtracking'] },
  { titleSlug: 'permutations', title: 'Permutations', leetcodeId: 46, difficulty: 'Medium', tags: ['Array', 'Backtracking'] },
  { titleSlug: 'subsets-ii', title: 'Subsets II', leetcodeId: 90, difficulty: 'Medium', tags: ['Array', 'Backtracking', 'Bit Manipulation'] },
  { titleSlug: 'combination-sum-ii', title: 'Combination Sum II', leetcodeId: 40, difficulty: 'Medium', tags: ['Array', 'Backtracking'] },
  { titleSlug: 'word-search', title: 'Word Search', leetcodeId: 79, difficulty: 'Medium', tags: ['Array', 'Backtracking', 'Matrix'] },
  { titleSlug: 'palindrome-partitioning', title: 'Palindrome Partitioning', leetcodeId: 131, difficulty: 'Medium', tags: ['String', 'Dynamic Programming', 'Backtracking'] },
  { titleSlug: 'letter-combinations-of-a-phone-number', title: 'Letter Combinations of a Phone Number', leetcodeId: 17, difficulty: 'Medium', tags: ['Hash Table', 'String', 'Backtracking'] },
  { titleSlug: 'n-queens', title: 'N-Queens', leetcodeId: 51, difficulty: 'Hard', tags: ['Array', 'Backtracking'] },

  // ─── Graphs ────────────────────────────────────────────────────────────────
  { titleSlug: 'number-of-islands', title: 'Number of Islands', leetcodeId: 200, difficulty: 'Medium', tags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Union Find', 'Matrix'] },
  { titleSlug: 'clone-graph', title: 'Clone Graph', leetcodeId: 133, difficulty: 'Medium', tags: ['Hash Table', 'Depth-First Search', 'Breadth-First Search', 'Graph'] },
  { titleSlug: 'max-area-of-island', title: 'Max Area of Island', leetcodeId: 695, difficulty: 'Medium', tags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Union Find', 'Matrix'] },
  { titleSlug: 'pacific-atlantic-water-flow', title: 'Pacific Atlantic Water Flow', leetcodeId: 417, difficulty: 'Medium', tags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Matrix'] },
  { titleSlug: 'surrounded-regions', title: 'Surrounded Regions', leetcodeId: 130, difficulty: 'Medium', tags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Union Find', 'Matrix'] },
  { titleSlug: 'rotting-oranges', title: 'Rotting Oranges', leetcodeId: 994, difficulty: 'Medium', tags: ['Array', 'Breadth-First Search', 'Matrix'] },
  { titleSlug: 'walls-and-gates', title: 'Walls and Gates', leetcodeId: 286, difficulty: 'Medium', tags: ['Array', 'Breadth-First Search', 'Matrix'] },
  { titleSlug: 'course-schedule', title: 'Course Schedule', leetcodeId: 207, difficulty: 'Medium', tags: ['Depth-First Search', 'Breadth-First Search', 'Graph', 'Topological Sort'] },
  { titleSlug: 'course-schedule-ii', title: 'Course Schedule II', leetcodeId: 210, difficulty: 'Medium', tags: ['Depth-First Search', 'Breadth-First Search', 'Graph', 'Topological Sort'] },
  { titleSlug: 'redundant-connection', title: 'Redundant Connection', leetcodeId: 684, difficulty: 'Medium', tags: ['Depth-First Search', 'Breadth-First Search', 'Union Find', 'Graph'] },
  { titleSlug: 'number-of-connected-components-in-an-undirected-graph', title: 'Number of Connected Components in an Undirected Graph', leetcodeId: 323, difficulty: 'Medium', tags: ['Depth-First Search', 'Breadth-First Search', 'Union Find', 'Graph'] },
  { titleSlug: 'graph-valid-tree', title: 'Graph Valid Tree', leetcodeId: 261, difficulty: 'Medium', tags: ['Depth-First Search', 'Breadth-First Search', 'Union Find', 'Graph'] },
  { titleSlug: 'word-ladder', title: 'Word Ladder', leetcodeId: 127, difficulty: 'Hard', tags: ['Hash Table', 'String', 'Breadth-First Search'] },

  // ─── Advanced Graphs ────────────────────────────────────────────────────────
  { titleSlug: 'reconstruct-itinerary', title: 'Reconstruct Itinerary', leetcodeId: 332, difficulty: 'Hard', tags: ['Depth-First Search', 'Graph', 'Eulerian Circuit'] },
  { titleSlug: 'min-cost-to-connect-all-points', title: 'Min Cost to Connect All Points', leetcodeId: 1584, difficulty: 'Medium', tags: ['Array', 'Union Find', 'Graph', 'Minimum Spanning Tree'] },
  { titleSlug: 'network-delay-time', title: 'Network Delay Time', leetcodeId: 743, difficulty: 'Medium', tags: ['Depth-First Search', 'Breadth-First Search', 'Graph', 'Heap (Priority Queue)', 'Shortest Path'] },
  { titleSlug: 'swim-in-rising-water', title: 'Swim in Rising Water', leetcodeId: 778, difficulty: 'Hard', tags: ['Array', 'Binary Search', 'Depth-First Search', 'Breadth-First Search', 'Union Find', 'Heap (Priority Queue)', 'Matrix'] },
  { titleSlug: 'alien-dictionary', title: 'Alien Dictionary', leetcodeId: 269, difficulty: 'Hard', tags: ['Array', 'String', 'Depth-First Search', 'Breadth-First Search', 'Graph', 'Topological Sort'] },
  { titleSlug: 'cheapest-flights-within-k-stops', title: 'Cheapest Flights Within K Stops', leetcodeId: 787, difficulty: 'Medium', tags: ['Dynamic Programming', 'Depth-First Search', 'Breadth-First Search', 'Graph', 'Heap (Priority Queue)', 'Shortest Path'] },

  // ─── 1-D DP ────────────────────────────────────────────────────────────────
  { titleSlug: 'climbing-stairs', title: 'Climbing Stairs', leetcodeId: 70, difficulty: 'Easy', tags: ['Math', 'Dynamic Programming', 'Memoization'] },
  { titleSlug: 'min-cost-climbing-stairs', title: 'Min Cost Climbing Stairs', leetcodeId: 746, difficulty: 'Easy', tags: ['Array', 'Dynamic Programming'] },
  { titleSlug: 'house-robber', title: 'House Robber', leetcodeId: 198, difficulty: 'Medium', tags: ['Array', 'Dynamic Programming'] },
  { titleSlug: 'house-robber-ii', title: 'House Robber II', leetcodeId: 213, difficulty: 'Medium', tags: ['Array', 'Dynamic Programming'] },
  { titleSlug: 'longest-palindromic-substring', title: 'Longest Palindromic Substring', leetcodeId: 5, difficulty: 'Medium', tags: ['Two Pointers', 'String', 'Dynamic Programming'] },
  { titleSlug: 'palindromic-substrings', title: 'Palindromic Substrings', leetcodeId: 647, difficulty: 'Medium', tags: ['Two Pointers', 'String', 'Dynamic Programming'] },
  { titleSlug: 'decode-ways', title: 'Decode Ways', leetcodeId: 91, difficulty: 'Medium', tags: ['String', 'Dynamic Programming'] },
  { titleSlug: 'coin-change', title: 'Coin Change', leetcodeId: 322, difficulty: 'Medium', tags: ['Array', 'Dynamic Programming', 'Breadth-First Search'] },
  { titleSlug: 'maximum-product-subarray', title: 'Maximum Product Subarray', leetcodeId: 152, difficulty: 'Medium', tags: ['Array', 'Dynamic Programming'] },
  { titleSlug: 'word-break', title: 'Word Break', leetcodeId: 139, difficulty: 'Medium', tags: ['Array', 'Hash Table', 'String', 'Dynamic Programming', 'Trie', 'Memoization'] },
  { titleSlug: 'longest-increasing-subsequence', title: 'Longest Increasing Subsequence', leetcodeId: 300, difficulty: 'Medium', tags: ['Array', 'Binary Search', 'Dynamic Programming'] },
  { titleSlug: 'partition-equal-subset-sum', title: 'Partition Equal Subset Sum', leetcodeId: 416, difficulty: 'Medium', tags: ['Array', 'Dynamic Programming'] },

  // ─── 2-D DP ────────────────────────────────────────────────────────────────
  { titleSlug: 'unique-paths', title: 'Unique Paths', leetcodeId: 62, difficulty: 'Medium', tags: ['Math', 'Dynamic Programming', 'Combinatorics'] },
  { titleSlug: 'longest-common-subsequence', title: 'Longest Common Subsequence', leetcodeId: 1143, difficulty: 'Medium', tags: ['String', 'Dynamic Programming'] },
  { titleSlug: 'best-time-to-buy-and-sell-stock-with-cooldown', title: 'Best Time to Buy and Sell Stock with Cooldown', leetcodeId: 309, difficulty: 'Medium', tags: ['Array', 'Dynamic Programming'] },
  { titleSlug: 'coin-change-ii', title: 'Coin Change II', leetcodeId: 518, difficulty: 'Medium', tags: ['Array', 'Dynamic Programming'] },
  { titleSlug: 'target-sum', title: 'Target Sum', leetcodeId: 494, difficulty: 'Medium', tags: ['Array', 'Dynamic Programming', 'Backtracking'] },
  { titleSlug: 'interleaving-string', title: 'Interleaving String', leetcodeId: 97, difficulty: 'Medium', tags: ['String', 'Dynamic Programming'] },
  { titleSlug: 'longest-increasing-path-in-a-matrix', title: 'Longest Increasing Path in a Matrix', leetcodeId: 329, difficulty: 'Hard', tags: ['Array', 'Dynamic Programming', 'Depth-First Search', 'Breadth-First Search', 'Graph', 'Topological Sort', 'Memoization', 'Matrix'] },
  { titleSlug: 'distinct-subsequences', title: 'Distinct Subsequences', leetcodeId: 115, difficulty: 'Hard', tags: ['String', 'Dynamic Programming'] },
  { titleSlug: 'edit-distance', title: 'Edit Distance', leetcodeId: 72, difficulty: 'Medium', tags: ['String', 'Dynamic Programming'] },
  { titleSlug: 'burst-balloons', title: 'Burst Balloons', leetcodeId: 312, difficulty: 'Hard', tags: ['Array', 'Dynamic Programming'] },
  { titleSlug: 'regular-expression-matching', title: 'Regular Expression Matching', leetcodeId: 10, difficulty: 'Hard', tags: ['String', 'Dynamic Programming', 'Recursion'] },

  // ─── Greedy ────────────────────────────────────────────────────────────────
  { titleSlug: 'maximum-subarray', title: 'Maximum Subarray', leetcodeId: 53, difficulty: 'Medium', tags: ['Array', 'Divide and Conquer', 'Dynamic Programming'] },
  { titleSlug: 'jump-game', title: 'Jump Game', leetcodeId: 55, difficulty: 'Medium', tags: ['Array', 'Dynamic Programming', 'Greedy'] },
  { titleSlug: 'jump-game-ii', title: 'Jump Game II', leetcodeId: 45, difficulty: 'Medium', tags: ['Array', 'Dynamic Programming', 'Greedy'] },
  { titleSlug: 'gas-station', title: 'Gas Station', leetcodeId: 134, difficulty: 'Medium', tags: ['Array', 'Greedy'] },
  { titleSlug: 'hand-of-straights', title: 'Hand of Straights', leetcodeId: 846, difficulty: 'Medium', tags: ['Array', 'Hash Table', 'Greedy', 'Sorting'] },
  { titleSlug: 'merge-triplets-to-form-target-triplet', title: 'Merge Triplets to Form Target Triplet', leetcodeId: 1899, difficulty: 'Medium', tags: ['Array', 'Greedy'] },
  { titleSlug: 'partition-labels', title: 'Partition Labels', leetcodeId: 763, difficulty: 'Medium', tags: ['Hash Table', 'Two Pointers', 'String', 'Greedy'] },
  { titleSlug: 'valid-parenthesis-string', title: 'Valid Parenthesis String', leetcodeId: 678, difficulty: 'Medium', tags: ['String', 'Dynamic Programming', 'Stack', 'Greedy'] },

  // ─── Intervals ─────────────────────────────────────────────────────────────
  { titleSlug: 'insert-interval', title: 'Insert Interval', leetcodeId: 57, difficulty: 'Medium', tags: ['Array'] },
  { titleSlug: 'merge-intervals', title: 'Merge Intervals', leetcodeId: 56, difficulty: 'Medium', tags: ['Array', 'Sorting'] },
  { titleSlug: 'non-overlapping-intervals', title: 'Non-overlapping Intervals', leetcodeId: 435, difficulty: 'Medium', tags: ['Array', 'Dynamic Programming', 'Greedy', 'Sorting'] },
  { titleSlug: 'meeting-rooms', title: 'Meeting Rooms', leetcodeId: 252, difficulty: 'Easy', tags: ['Array', 'Sorting'] },
  { titleSlug: 'meeting-rooms-ii', title: 'Meeting Rooms II', leetcodeId: 253, difficulty: 'Medium', tags: ['Array', 'Two Pointers', 'Greedy', 'Sorting', 'Heap (Priority Queue)', 'Prefix Sum'] },
  { titleSlug: 'minimum-interval-to-include-each-query', title: 'Minimum Interval to Include Each Query', leetcodeId: 1851, difficulty: 'Hard', tags: ['Array', 'Binary Search', 'Line Sweep', 'Sorting', 'Heap (Priority Queue)'] },

  // ─── Math & Geometry ───────────────────────────────────────────────────────
  { titleSlug: 'rotate-image', title: 'Rotate Image', leetcodeId: 48, difficulty: 'Medium', tags: ['Array', 'Math', 'Matrix'] },
  { titleSlug: 'spiral-matrix', title: 'Spiral Matrix', leetcodeId: 54, difficulty: 'Medium', tags: ['Array', 'Matrix', 'Simulation'] },
  { titleSlug: 'set-matrix-zeroes', title: 'Set Matrix Zeroes', leetcodeId: 73, difficulty: 'Medium', tags: ['Array', 'Hash Table', 'Matrix'] },
  { titleSlug: 'happy-number', title: 'Happy Number', leetcodeId: 202, difficulty: 'Easy', tags: ['Hash Table', 'Math', 'Two Pointers'] },
  { titleSlug: 'plus-one', title: 'Plus One', leetcodeId: 66, difficulty: 'Easy', tags: ['Array', 'Math'] },
  { titleSlug: 'pow-x-n', title: 'Pow(x, n)', leetcodeId: 50, difficulty: 'Medium', tags: ['Math', 'Recursion'] },
  { titleSlug: 'multiply-strings', title: 'Multiply Strings', leetcodeId: 43, difficulty: 'Medium', tags: ['Math', 'String', 'Simulation'] },
  { titleSlug: 'detect-squares', title: 'Detect Squares', leetcodeId: 2013, difficulty: 'Medium', tags: ['Array', 'Hash Table', 'Design', 'Counting'] },

  // ─── Bit Manipulation ──────────────────────────────────────────────────────
  { titleSlug: 'single-number', title: 'Single Number', leetcodeId: 136, difficulty: 'Easy', tags: ['Array', 'Bit Manipulation'] },
  { titleSlug: 'number-of-1-bits', title: 'Number of 1 Bits', leetcodeId: 191, difficulty: 'Easy', tags: ['Divide and Conquer', 'Bit Manipulation'] },
  { titleSlug: 'counting-bits', title: 'Counting Bits', leetcodeId: 338, difficulty: 'Easy', tags: ['Dynamic Programming', 'Bit Manipulation'] },
  { titleSlug: 'reverse-bits', title: 'Reverse Bits', leetcodeId: 190, difficulty: 'Easy', tags: ['Divide and Conquer', 'Bit Manipulation'] },
  { titleSlug: 'missing-number', title: 'Missing Number', leetcodeId: 268, difficulty: 'Easy', tags: ['Array', 'Hash Table', 'Math', 'Binary Search', 'Bit Manipulation', 'Sorting'] },
  { titleSlug: 'sum-of-two-integers', title: 'Sum of Two Integers', leetcodeId: 371, difficulty: 'Medium', tags: ['Math', 'Bit Manipulation'] },
  { titleSlug: 'reverse-integer', title: 'Reverse Integer', leetcodeId: 7, difficulty: 'Medium', tags: ['Math'] },
];

/** Build a fast lookup map: titleSlug → problem */
export const NEETCODE_MAP = new Map(NEETCODE_150.map(p => [p.titleSlug, p]));

/** All unique topic tags, in dependency order */
export const TOPIC_ORDER = [
  'Array',
  'Hash Table',
  'String',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Sorting',
  'Binary Search',
  'Linked List',
  'Tree',
  'Binary Tree',
  'Binary Search Tree',
  'Trie',
  'Heap (Priority Queue)',
  'Backtracking',
  'Graph',
  'Union Find',
  'Topological Sort',
  'Dynamic Programming',
  'Greedy',
  'Math',
  'Bit Manipulation',
  'Matrix',
  'Design',
  'Recursion',
  'Divide and Conquer',
];
