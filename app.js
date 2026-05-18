﻿﻿﻿const THEME_KEY = "dsa_faang_theme";
const STATE_KEY = "dsa_faang_state";
const SHEETS_API_URL = "";
const SYNC_STATUS_ID = "syncStatus";
let chart;
let syncTimer;

function isNightMode(){
  return document.body.classList.contains("night-mode");
}

function applyTheme(theme){
  let night = theme === "night";
  document.body.classList.toggle("night-mode", night);
  let button = document.getElementById("themeToggle");
  if(button){
    button.setAttribute("aria-label", night ? "Switch to day mode" : "Switch to night mode");
    button.innerHTML = night ? '<span class="theme-symbol" aria-hidden="true">&#9728;</span><span>Day</span>' : '<span class="theme-symbol" aria-hidden="true">&#9790;</span><span>Night</span>';
  }
  if(typeof chart !== "undefined" && chart) updateChart();
}

function toggleTheme(){
  let nextTheme = isNightMode() ? "day" : "night";
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
}

applyTheme(localStorage.getItem(THEME_KEY) || "day");

const PROBLEMS_DB = {};

const problemSlug = title => String(title || "")
  .toLowerCase()
  .replace(/&/g, "and")
  .replace(/\+/g, "plus")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function escapeJsString(value){
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}

function safeExternalUrl(url){
  let value = String(url || "").trim();
  if(!value) return "";
  try{
    let parsed = new URL(value, window.location.href);
    if(parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
  } catch(error){
    return "";
  }
  return "";
}

function normalizeDifficulty(value){
  let difficulty = String(value || "medium").toLowerCase().trim();
  return ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "medium";
}

function parseCompleted(value){
  return value === true || value === "true" || value === "TRUE" || value === 1 || value === "1";
}

function parseProblemRow(row){
  let [title, difficulty, slug] = String(row || "").split("|").map(part => part.trim());
  let cleanTitle = title || "Untitled Problem";
  let cleanSlug = slug || problemSlug(cleanTitle);
  return {
    title: cleanTitle,
    difficulty: normalizeDifficulty(difficulty),
    slug: cleanSlug,
    url: `https://leetcode.com/problems/${cleanSlug}/`
  };
}

// Legacy pattern IDs preserve old localStorage progress even after adding new patterns.
const LEGACY_PATTERN_IDS = Object.freeze({
  "Two Pointers": 0,
  "Sliding Window": 1,
  "Prefix Sum": 2,
  "Cyclic Sort": 3,
  "Binary Search (Extended)": 4,
  "HashMap Patterns": 5,
  "Merge Intervals": 6,
  "Monotonic Stack": 7,
  "Monotonic Deque": 8,
  "Tree DFS - 4 subtypes": 9,
  "Tree BFS / Level Order": 10,
  "BST Patterns": 11,
  "Graph BFS Patterns": 12,
  "Graph DFS Patterns": 13,
  "Topological Sort": 14,
  "Union-Find (DSU)": 15,
  "Shortest Path Patterns": 16,
  "1D DP - Linear": 17,
  "0/1 Knapsack": 18,
  "Unbounded Knapsack": 19,
  "LCS Family": 20,
  "LIS Family": 21,
  "DP on Grids": 22,
  "Palindrome DP": 23,
  "Interval DP": 24,
  "DP on Trees": 25,
  "Digit DP": 26,
  "Bitmask DP": 27,
  "Trie": 28,
  "Backtracking": 29,
  "Two Heaps": 30,
  "Bit Manipulation": 31,
  "Greedy Patterns": 32,
  "Segment Tree / BIT": 33,
  "Linked List": 34,
  "Stack / Queue Basics": 35,
  "Design Data Structures": 36
});

// Only rows that changed need explicit legacy rows. This prevents old index-based
// progress from being applied to the wrong problem after row edits.
const LEGACY_PROBLEM_ROWS_FOR_MIGRATION = {
  "Two Pointers": `Valid Palindrome|easy;Two Sum II - Input Array Sorted|easy;Remove Duplicates from Sorted Array|easy;Remove Element|easy;Move Zeroes|easy;Squares of a Sorted Array|easy;3Sum|medium;3Sum Closest|medium;4Sum|medium;Container With Most Water|medium;Sort Colors|medium;Boats to Save People|medium;Partition Labels|medium;Next Permutation|medium;Rotate Array|medium;Valid Triangle Number|medium;Trapping Rain Water|hard;Minimum Window Substring|hard;Substring with Concatenation of All Words|hard;Count of Range Sum|hard`,
  "HashMap Patterns": `Two Sum|easy;Valid Anagram|easy;Contains Duplicate|easy;Intersection of Two Arrays|easy;Isomorphic Strings|easy;Word Pattern|easy;Ransom Note|easy;Group Anagrams|medium;Top K Frequent Elements|medium;Subarray Sum Equals K|medium;Longest Consecutive Sequence|medium;Encode and Decode Strings|medium|encode-and-decode-strings;Find Duplicate File in System|medium;Brick Wall|medium;Insert Delete GetRandom O(1)|medium|insert-delete-getrandom-o1;Design Underground System|medium;Minimum Window Substring|hard;LFU Cache|hard;Substring with Concatenation of All Words|hard;Number of Good Paths|hard`,
  "Topological Sort": `Course Schedule|medium;Course Schedule II|medium;Find Eventual Safe States|medium;Minimum Height Trees|medium;Sequence Reconstruction|medium|sequence-reconstruction;Parallel Courses|medium|parallel-courses;Recipe from Supplies|medium|find-all-possible-recipes-from-given-supplies;Loud and Rich|medium;All Ancestors of a Node in a Directed Acyclic Graph|medium;Find Champion II|medium;Alien Dictionary|hard|alien-dictionary;Parallel Courses II|hard;Sort Items by Groups Respecting Dependencies|hard;Largest Color Value in a Directed Graph|hard;Build a Matrix With Conditions|hard;Strange Printer II|hard;Course Schedule III|hard;Maximum Employees to Be Invited to a Meeting|hard;Minimum Time to Complete All Courses|hard|parallel-courses-iii;Longest Increasing Path in a Matrix|hard`,
  "0/1 Knapsack": `Partition Equal Subset Sum|medium;Target Sum|medium;Last Stone Weight II|medium;Ones and Zeroes|medium;Shopping Offers|medium;Coin Change|medium;Coin Change II|medium;Combination Sum IV|medium;Number of Dice Rolls With Target Sum|medium;Knight Probability in Chessboard|medium;Minimum Subset Sum Difference|medium|partition-equal-subset-sum;Count of Subsets with Sum K|medium|target-sum;Profitable Schemes|hard;Split Array With Same Average|hard;Form Largest Integer With Digits That Add up to Target|hard;Tallest Billboard|hard;Maximum Value of K Coins From Piles|hard;Find the Sum of the Power of All Subsequences|hard;Reducing Dishes|hard;Maximum Profit in Job Scheduling|hard`,
  "Unbounded Knapsack": `Coin Change|medium;Coin Change II|medium;Combination Sum IV|medium;Perfect Squares|medium;Integer Break|medium;Word Break|medium;Minimum Cost For Tickets|medium;Decode Ways|medium;Number of Dice Rolls With Target Sum|medium;Soup Servings|medium;Domino and Tromino Tiling|medium;Minimum Number of Work Sessions to Finish the Tasks|medium;Ways to Express an Integer as Sum of Powers|medium;Largest Number|hard|form-largest-integer-with-digits-that-add-up-to-target;Profitable Schemes|hard;Minimum Cost to Cut a Stick|hard;Strange Printer|hard;Race Car|hard;Word Break II|hard;Restore The Array|hard`,
  "LIS Family": `Longest Increasing Subsequence|medium;Number of Longest Increasing Subsequence|medium;Maximum Length of Pair Chain|medium;Longest Arithmetic Subsequence|medium;Longest Arithmetic Subsequence of Given Difference|medium;Largest Divisible Subset|medium;Increasing Triplet Subsequence|medium;Wiggle Subsequence|medium;Best Team With No Conflicts|medium;Longest Ideal Subsequence|medium;Longest Unequal Adjacent Groups Subsequence II|medium;Longest String Chain|medium;Russian Doll Envelopes|hard;Minimum Number of Removals to Make Mountain Array|hard;Longest Obstacle Course at Each Position|hard;Make Array Strictly Increasing|hard;Maximum Profit in Job Scheduling|hard;Find the Longest Valid Obstacle Course at Each Position|hard;Minimum Operations to Make the Array K-Increasing|hard;Maximum Balanced Subsequence Sum|hard`,
  "Interval DP": `Minimum Score Triangulation of Polygon|medium;Guess Number Higher or Lower II|medium;Stone Game|medium;Stone Game II|medium;Stone Game VII|medium;Predict the Winner|medium;Minimum Cost Tree From Leaf Values|medium;Burst Balloons|hard;Minimum Cost to Cut a Stick|hard;Strange Printer|hard;Palindrome Partitioning II|hard;Matrix Chain Multiplication|hard|minimum-score-triangulation-of-polygon;Remove Boxes|hard;Stone Game III|hard;Stone Game V|hard;Optimal Account Balancing|hard|optimal-account-balancing;Merge Stones|hard|minimum-cost-to-merge-stones;Allocate Mailboxes|hard;Valid Palindrome III|hard|valid-palindrome-iii;Scramble String|hard`,
  "Segment Tree / BIT": `Range Sum Query - Mutable|medium;NumMatrix|medium|range-sum-query-2d-mutable;Count of Smaller Numbers After Self|hard;Reverse Pairs|hard;Count of Range Sum|hard;The Skyline Problem|hard;Falling Squares|hard;My Calendar III|hard;Range Module|hard;Create Sorted Array through Instructions|hard;Peaks in Array|hard|peaks-in-array;Handling Sum Queries After Update|hard;Longest Increasing Subsequence II|hard;Maximum Sum Queries|hard;Count Integers in Intervals|hard;Number of Flowers in Full Bloom|hard;Minimum Cost to Make Array Equal|hard;Booking Concert Tickets in Groups|hard;Block Placement Queries|hard|block-placement-queries;Count the Number of Inversions|hard`
};

function buildLegacyProblemIndex(){
  let index = new Map();
  for(let [pattern, rows] of Object.entries(LEGACY_PROBLEM_ROWS_FOR_MIGRATION)){
    rows.split(";").filter(Boolean).forEach((row, idx) => {
      let problem = parseProblemRow(row);
      index.set(`${pattern}::title::${problem.title}`, idx);
      index.set(`${pattern}::slug::${problem.slug}`, idx);
    });
  }
  return index;
}

const LEGACY_PROBLEM_INDEX = buildLegacyProblemIndex();

// Expanded FAANG-level catalog: 37 patterns x 20 LeetCode problems = 740 linked placements.
const EXPANDED_PROBLEM_ROWS = {
  "Two Pointers": `Valid Palindrome|easy;Valid Palindrome II|easy;Two Sum II - Input Array Sorted|easy;Remove Duplicates from Sorted Array|easy;Remove Element|easy;Move Zeroes|easy;Squares of a Sorted Array|easy;Backspace String Compare|easy;3Sum|medium;3Sum Closest|medium;4Sum|medium;Container With Most Water|medium;Sort Colors|medium;Boats to Save People|medium;Partition Labels|medium;Next Permutation|medium;Rotate Array|medium;Valid Triangle Number|medium;Trapping Rain Water|hard;Substring with Concatenation of All Words|hard`,
  "Sliding Window": `Maximum Average Subarray I|easy;Contains Duplicate II|easy;Find the K-Beauty of a Number|easy;Minimum Recolors to Get K Consecutive Black Blocks|easy;Longest Substring Without Repeating Characters|medium;Longest Repeating Character Replacement|medium;Permutation in String|medium;Find All Anagrams in a String|medium;Maximum Points You Can Obtain from Cards|medium;Max Consecutive Ones III|medium;Fruit Into Baskets|medium;Minimum Size Subarray Sum|medium;Frequency of the Most Frequent Element|medium;Grumpy Bookstore Owner|medium;Get Equal Substrings Within Budget|medium;Longest Subarray of 1s After Deleting One Element|medium|longest-subarray-of-1s-after-deleting-one-element;Minimum Window Substring|hard;Sliding Window Maximum|hard;Minimum Number of K Consecutive Bit Flips|hard;Count Subarrays With Fixed Bounds|hard`,
  "Prefix Sum": `Running Sum of 1d Array|easy;Find Pivot Index|easy;Range Sum Query - Immutable|easy;Left and Right Sum Differences|easy;Minimum Value to Get Positive Step by Step Sum|easy;Subarray Sum Equals K|medium;Contiguous Array|medium;Continuous Subarray Sum|medium;Product of Array Except Self|medium;Range Sum Query 2D - Immutable|medium;Number of Subarrays With Odd Sum|medium;Subarray Sums Divisible by K|medium;Find the Longest Substring Containing Vowels in Even Counts|medium;Maximum Size Subarray Sum Equals k|medium|maximum-size-subarray-sum-equals-k;Path Sum III|medium;Minimum Operations to Reduce X to Zero|medium;Count of Range Sum|hard;Maximum Sum of 3 Non-Overlapping Subarrays|hard;Number of Submatrices That Sum to Target|hard;Split Array Largest Sum|hard`,
  "Cyclic Sort": `Missing Number|easy;Find All Numbers Disappeared in an Array|easy;Set Mismatch|easy;Find the Difference|easy;Kth Missing Positive Number|easy;Contains Duplicate|easy;Contains Duplicate II|easy;Duplicate Zeros|easy;Find the Duplicate Number|medium;Find All Duplicates in an Array|medium;Find Missing Observations|medium;Minimum Swaps to Arrange a Binary Grid|medium;Rearrange Array Elements by Sign|medium;Array Nesting|medium;H-Index|medium;H-Index II|medium;Smallest Missing Non-negative Integer After Operations|medium;First Missing Positive|hard;Couples Holding Hands|hard;Minimum Number of Operations to Make Array Continuous|hard`,
  "Linked List": `Reverse Linked List|easy;Merge Two Sorted Lists|easy;Linked List Cycle|easy;Palindrome Linked List|easy;Intersection of Two Linked Lists|easy;Remove Nth Node From End of List|medium;Add Two Numbers|medium;Swap Nodes in Pairs|medium;Reverse Linked List II|medium;Copy List with Random Pointer|medium;Linked List Cycle II|medium;Reorder List|medium;Sort List|medium;Partition List|medium;Odd Even Linked List|medium;Rotate List|medium;Design Linked List|medium;Flatten a Multilevel Doubly Linked List|medium;Merge k Sorted Lists|hard;Reverse Nodes in k-Group|hard`,
  "Stack / Queue Basics": `Valid Parentheses|easy;Implement Queue using Stacks|easy;Implement Stack using Queues|easy;Baseball Game|easy;Number of Recent Calls|easy;Min Stack|medium;Evaluate Reverse Polish Notation|medium;Decode String|medium;Simplify Path|medium;Validate Stack Sequences|medium;Exclusive Time of Functions|medium;Remove All Adjacent Duplicates in String II|medium;Design Browser History|medium;Design Circular Deque|medium;Design Front Middle Back Queue|medium;Car Fleet|medium;Basic Calculator II|medium;Basic Calculator|hard;Longest Valid Parentheses|hard;Maximum Frequency Stack|hard`,
  "Binary Search (Extended)": `Binary Search|easy;Search Insert Position|easy;First Bad Version|easy;Sqrt(x)|easy|sqrtx;Guess Number Higher or Lower|easy;Find First and Last Position of Element in Sorted Array|medium;Search in Rotated Sorted Array|medium;Search in Rotated Sorted Array II|medium;Find Minimum in Rotated Sorted Array|medium;Find Peak Element|medium;Search a 2D Matrix|medium;Search a 2D Matrix II|medium;Koko Eating Bananas|medium;Capacity To Ship Packages Within D Days|medium;Find K Closest Elements|medium;Time Based Key-Value Store|medium;Median of Two Sorted Arrays|hard;Split Array Largest Sum|hard;Kth Smallest Product of Two Sorted Arrays|hard;Find in Mountain Array|hard`,
  "HashMap Patterns": `Two Sum|easy;Valid Anagram|easy;Contains Duplicate|easy;Intersection of Two Arrays|easy;Isomorphic Strings|easy;Word Pattern|easy;Ransom Note|easy;Group Anagrams|medium;Top K Frequent Elements|medium;Subarray Sum Equals K|medium;Longest Consecutive Sequence|medium;Encode and Decode Strings|medium|encode-and-decode-strings;Find Duplicate File in System|medium;Brick Wall|medium;Insert Delete GetRandom O(1)|medium|insert-delete-getrandom-o1;Design Underground System|medium;LRU Cache|medium;Minimum Window Substring|hard;LFU Cache|hard;Substring with Concatenation of All Words|hard`,
  "Merge Intervals": `Summary Ranges|easy;Meeting Rooms|easy|meeting-rooms;Merge Intervals|medium;Insert Interval|medium;Non-overlapping Intervals|medium;Meeting Rooms II|medium|meeting-rooms-ii;Minimum Number of Arrows to Burst Balloons|medium;Interval List Intersections|medium;Car Pooling|medium;My Calendar I|medium;My Calendar II|medium;Partition Labels|medium;Remove Covered Intervals|medium;Data Stream as Disjoint Intervals|hard;Employee Free Time|hard|employee-free-time;My Calendar III|hard;Range Module|hard;Amount of New Area Painted Each Day|hard|amount-of-new-area-painted-each-day;Count Integers in Intervals|hard;The Skyline Problem|hard`,
  "Monotonic Stack": `Next Greater Element I|easy;Final Prices With a Special Discount in a Shop|easy;Daily Temperatures|medium;Next Greater Element II|medium;Online Stock Span|medium;132 Pattern|medium;Remove K Digits|medium;Asteroid Collision|medium;Sum of Subarray Minimums|medium;Maximum Width Ramp|medium;Find the Most Competitive Subsequence|medium;Steps to Make Array Non-decreasing|medium;Remove Duplicate Letters|medium;Largest Rectangle in Histogram|hard;Maximal Rectangle|hard;Trapping Rain Water|hard;Basic Calculator|hard;Number of Visible People in a Queue|hard;Sum of Total Strength of Wizards|hard;Create Maximum Number|hard`,
  "Monotonic Deque": `Maximum Average Subarray I|easy;Find the Power of K-Size Subarrays I|easy;Jump Game VI|medium;Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit|medium;Continuous Subarrays|medium;Find the Power of K-Size Subarrays II|medium;Longest Subarray of 1s After Deleting One Element|medium|longest-subarray-of-1s-after-deleting-one-element;Maximum Points You Can Obtain from Cards|medium;Minimum Size Subarray Sum|medium;Maximum Sum Circular Subarray|medium;Sliding Window Maximum|hard;Shortest Subarray with Sum at Least K|hard;Constrained Subsequence Sum|hard;Maximum Number of Robots Within Budget|hard;Max Value of Equation|hard;Minimum Number of K Consecutive Bit Flips|hard;Count Subarrays With Fixed Bounds|hard;Subarrays with K Different Integers|hard;Shortest and Lexicographically Smallest Beautiful String|medium;Minimum Limit of Balls in a Bag|medium`,
  "Tree DFS - 4 subtypes": `Maximum Depth of Binary Tree|easy;Invert Binary Tree|easy;Same Tree|easy;Subtree of Another Tree|easy;Path Sum|easy;Diameter of Binary Tree|easy;Lowest Common Ancestor of a Binary Tree|medium;Path Sum II|medium;Path Sum III|medium;Construct Binary Tree from Preorder and Inorder Traversal|medium;Validate Binary Search Tree|medium;Flatten Binary Tree to Linked List|medium;Binary Tree Right Side View|medium;House Robber III|medium;Recover Binary Search Tree|medium;Smallest String Starting From Leaf|medium;Sum Root to Leaf Numbers|medium;Binary Tree Maximum Path Sum|hard;Serialize and Deserialize Binary Tree|hard;Binary Tree Cameras|hard`,
  "Tree BFS / Level Order": `Average of Levels in Binary Tree|easy;Minimum Depth of Binary Tree|easy;Maximum Depth of Binary Tree|easy;Cousins in Binary Tree|easy;Binary Tree Level Order Traversal|medium;Binary Tree Zigzag Level Order Traversal|medium;Binary Tree Right Side View|medium;Populating Next Right Pointers in Each Node|medium;Populating Next Right Pointers in Each Node II|medium;Find Largest Value in Each Tree Row|medium;Check Completeness of a Binary Tree|medium;Even Odd Tree|medium;Binary Tree Vertical Order Traversal|medium|binary-tree-vertical-order-traversal;All Nodes Distance K in Binary Tree|medium;Find Bottom Left Tree Value|medium;Maximum Width of Binary Tree|medium;Reverse Odd Levels of Binary Tree|medium;Amount of Time for Binary Tree to Be Infected|medium;Vertical Order Traversal of a Binary Tree|hard;Serialize and Deserialize Binary Tree|hard`,
  "BST Patterns": `Search in a Binary Search Tree|easy;Convert Sorted Array to Binary Search Tree|easy;Minimum Absolute Difference in BST|easy;Range Sum of BST|easy;Two Sum IV - Input is a BST|easy;Closest Binary Search Tree Value|easy|closest-binary-search-tree-value;Insert into a Binary Search Tree|medium;Delete Node in a BST|medium;Validate Binary Search Tree|medium;Kth Smallest Element in a BST|medium;Lowest Common Ancestor of a Binary Search Tree|medium;Recover Binary Search Tree|medium;Binary Search Tree Iterator|medium;Trim a Binary Search Tree|medium;Convert BST to Greater Tree|medium;Balance a Binary Search Tree|medium;Unique Binary Search Trees|medium;Unique Binary Search Trees II|medium;Closest Binary Search Tree Value II|hard|closest-binary-search-tree-value-ii;Count of Smaller Numbers After Self|hard`,
  "Graph BFS Patterns": `Flood Fill|easy;Find if Path Exists in Graph|easy;Rotting Oranges|medium;Open the Lock|medium;Minimum Genetic Mutation|medium;Nearest Exit from Entrance in Maze|medium;Shortest Path in Binary Matrix|medium;As Far from Land as Possible|medium;01 Matrix|medium|01-matrix;Walls and Gates|medium|walls-and-gates;Snakes and Ladders|medium;Jump Game III|medium;Clone Graph|medium;Evaluate Division|medium;Shortest Bridge|medium;Word Ladder|hard;Bus Routes|hard;Cut Off Trees for Golf Event|hard;Shortest Path to Get All Keys|hard;Jump Game IV|hard`,
  "Graph DFS Patterns": `Flood Fill|easy;Number of Islands|medium;Max Area of Island|medium;Clone Graph|medium;Pacific Atlantic Water Flow|medium;Surrounded Regions|medium;Evaluate Division|medium;Accounts Merge|medium;Keys and Rooms|medium;Number of Provinces|medium;Distinct Islands|medium|number-of-distinct-islands;Detect Cycles in 2D Grid|medium;Path With Maximum Gold|medium;All Paths From Source to Target|medium;Redundant Connection|medium;Most Stones Removed with Same Row or Column|medium;Reconstruct Itinerary|hard;Critical Connections in a Network|hard;Making A Large Island|hard;Remove Invalid Parentheses|hard`,
  "Topological Sort": `Course Schedule|medium;Course Schedule II|medium;Find Eventual Safe States|medium;Minimum Height Trees|medium;Sequence Reconstruction|medium|sequence-reconstruction;Parallel Courses|medium|parallel-courses;Find All Possible Recipes from Given Supplies|medium;Loud and Rich|medium;All Ancestors of a Node in a Directed Acyclic Graph|medium;Find Champion II|medium;Alien Dictionary|hard|alien-dictionary;Parallel Courses II|hard;Sort Items by Groups Respecting Dependencies|hard;Largest Color Value in a Directed Graph|hard;Build a Matrix With Conditions|hard;Strange Printer II|hard;Course Schedule III|hard;Maximum Employees to Be Invited to a Meeting|hard;Parallel Courses III|hard;Longest Increasing Path in a Matrix|hard`,
  "Union-Find (DSU)": `Find if Path Exists in Graph|easy;Number of Provinces|medium;Redundant Connection|medium;Accounts Merge|medium;Satisfiability of Equality Equations|medium;Most Stones Removed with Same Row or Column|medium;Number of Connected Components in an Undirected Graph|medium|number-of-connected-components-in-an-undirected-graph;Graph Valid Tree|medium|graph-valid-tree;Connecting Cities With Minimum Cost|medium|connecting-cities-with-minimum-cost;Min Cost to Connect All Points|medium;Regions Cut By Slashes|medium;Similar String Groups|hard;Bricks Falling When Hit|hard;Swim in Rising Water|hard;Making A Large Island|hard;Rank Transform of a Matrix|hard;Number of Islands II|hard|number-of-islands-ii;Checking Existence of Edge Length Limited Paths|hard;Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree|hard;Remove Max Number of Edges to Keep Graph Fully Traversable|hard`,
  "Shortest Path Patterns": `Path with Maximum Probability|medium;Network Delay Time|medium;Cheapest Flights Within K Stops|medium;Path With Minimum Effort|medium;Find the City With the Smallest Number of Neighbors at a Threshold Distance|medium;Shortest Path in Binary Matrix|medium;The Maze II|medium|the-maze-ii;Number of Ways to Arrive at Destination|medium;Swim in Rising Water|hard;Minimum Cost to Make at Least One Valid Path in a Grid|hard;Shortest Path Visiting All Nodes|hard;The Maze III|hard|the-maze-iii;Reachable Nodes In Subdivided Graph|hard;Modify Graph Edge Weights|hard;Minimum Weighted Subgraph With the Required Paths|hard;Find Edges in Shortest Paths|hard|find-edges-in-shortest-paths;Minimum Obstacle Removal to Reach Corner|hard;Second Minimum Time to Reach Destination|hard;Minimum Time to Visit a Cell In a Grid|hard;Design Graph With Shortest Path Calculator|hard`,
  "1D DP - Linear": `Climbing Stairs|easy;Min Cost Climbing Stairs|easy;Best Time to Buy and Sell Stock|easy;House Robber|medium;House Robber II|medium;Delete and Earn|medium;Decode Ways|medium;Word Break|medium;Integer Break|medium;Perfect Squares|medium;Coin Change|medium;Combination Sum IV|medium;Maximum Product Subarray|medium;Maximum Subarray|medium;Best Time to Buy and Sell Stock II|medium;Best Time to Buy and Sell Stock with Cooldown|medium;Best Time to Buy and Sell Stock with Transaction Fee|medium;Minimum Cost For Tickets|medium;Best Time to Buy and Sell Stock III|hard;Best Time to Buy and Sell Stock IV|hard`,
  "0/1 Knapsack": `Partition Equal Subset Sum|medium;Target Sum|medium;Last Stone Weight II|medium;Ones and Zeroes|medium;Shopping Offers|medium;Solving Questions With Brainpower|medium;Partition to K Equal Sum Subsets|medium;Matchsticks to Square|medium;Number of Dice Rolls With Target Sum|medium;Knight Probability in Chessboard|medium;Coin Change|medium;Coin Change II|medium;Profitable Schemes|hard;Split Array With Same Average|hard;Form Largest Integer With Digits That Add up to Target|hard;Tallest Billboard|hard;Maximum Value of K Coins From Piles|hard;Find the Sum of the Power of All Subsequences|hard;Reducing Dishes|hard;Maximum Profit in Job Scheduling|hard`,
  "Unbounded Knapsack": `Coin Change|medium;Coin Change II|medium;Combination Sum IV|medium;Perfect Squares|medium;Integer Break|medium;Word Break|medium;Minimum Cost For Tickets|medium;Decode Ways|medium;Number of Dice Rolls With Target Sum|medium;Soup Servings|medium;Domino and Tromino Tiling|medium;Minimum Number of Work Sessions to Finish the Tasks|medium;Ways to Express an Integer as Sum of Powers|medium;Form Largest Integer With Digits That Add up to Target|hard;Profitable Schemes|hard;Minimum Cost to Cut a Stick|hard;Strange Printer|hard;Race Car|hard;Word Break II|hard;Restore The Array|hard`,
  "LCS Family": `Is Subsequence|easy;Longest Common Subsequence|medium;Uncrossed Lines|medium;Delete Operation for Two Strings|medium;Interleaving String|medium;Minimum ASCII Delete Sum for Two Strings|medium;Longest Palindromic Subsequence|medium;Number of Matching Subsequences|medium;Maximum Length of Repeated Subarray|medium;Longest String Chain|medium;Edit Distance|hard;Distinct Subsequences|hard;Shortest Common Supersequence|hard;Regular Expression Matching|hard;Wildcard Matching|hard;Scramble String|hard;Minimum Insertion Steps to Make a String Palindrome|hard;Distinct Subsequences II|hard;Count Different Palindromic Subsequences|hard;Longest Common Subpath|hard`,
  "LIS Family": `Longest Increasing Subsequence|medium;Number of Longest Increasing Subsequence|medium;Maximum Length of Pair Chain|medium;Longest Arithmetic Subsequence|medium;Longest Arithmetic Subsequence of Given Difference|medium;Largest Divisible Subset|medium;Increasing Triplet Subsequence|medium;Wiggle Subsequence|medium;Best Team With No Conflicts|medium;Longest Ideal Subsequence|medium;Longest Unequal Adjacent Groups Subsequence II|medium;Longest String Chain|medium;Russian Doll Envelopes|hard;Minimum Number of Removals to Make Mountain Array|hard;Find the Longest Valid Obstacle Course at Each Position|hard;Make Array Strictly Increasing|hard;Maximum Profit in Job Scheduling|hard;Minimum Operations to Make a Subsequence|hard;Minimum Operations to Make the Array K-Increasing|hard;Maximum Balanced Subsequence Sum|hard`,
  "DP on Grids": `Unique Paths|medium;Unique Paths II|medium;Minimum Path Sum|medium;Triangle|medium;Maximal Square|medium;Count Square Submatrices with All Ones|medium;Minimum Falling Path Sum|medium;Out of Boundary Paths|medium;Knight Probability in Chessboard|medium;Where Will the Ball Fall|medium;Minimum Cost Homecoming of a Robot in a Grid|medium;Maximum Number of Moves in a Grid|medium;Grid Game|medium;Dungeon Game|hard;Cherry Pickup|hard;Cherry Pickup II|hard;Minimum Falling Path Sum II|hard;Paths in Matrix Whose Sum Is Divisible by K|hard;Number of Increasing Paths in a Grid|hard;Unique Paths III|hard`,
  "Palindrome DP": `Valid Palindrome|easy;Valid Palindrome II|easy;Palindrome Number|easy;Longest Palindromic Substring|medium;Palindromic Substrings|medium;Longest Palindromic Subsequence|medium;Palindrome Partitioning|medium;Maximum Product of the Length of Two Palindromic Subsequences|medium;Break a Palindrome|medium;Construct K Palindrome Strings|medium;Can Make Palindrome from Substring|medium;Largest Palindromic Number|medium;Palindrome Partitioning II|hard;Palindrome Partitioning III|hard;Minimum Insertion Steps to Make a String Palindrome|hard;Shortest Palindrome|hard;Count Different Palindromic Subsequences|hard;Longest Chunked Palindrome Decomposition|hard;Super Palindromes|hard;Find the Closest Palindrome|hard`,
  "Interval DP": `Minimum Score Triangulation of Polygon|medium;Guess Number Higher or Lower II|medium;Stone Game|medium;Stone Game II|medium;Stone Game VII|medium;Predict the Winner|medium;Minimum Cost Tree From Leaf Values|medium;Different Ways to Add Parentheses|medium;Burst Balloons|hard;Minimum Cost to Cut a Stick|hard;Strange Printer|hard;Palindrome Partitioning II|hard;Remove Boxes|hard;Stone Game III|hard;Stone Game V|hard;Optimal Account Balancing|hard|optimal-account-balancing;Minimum Cost to Merge Stones|hard;Allocate Mailboxes|hard;Valid Palindrome III|hard|valid-palindrome-iii;Scramble String|hard`,
  "DP on Trees": `Diameter of Binary Tree|easy;House Robber III|medium;Longest Univalue Path|medium;Path Sum III|medium;Maximum Product of Splitted Binary Tree|medium;Minimum Height Trees|medium;Tree Diameter|medium|tree-diameter;Maximum Difference Between Node and Ancestor|medium;Distribute Coins in Binary Tree|medium;Time Needed to Inform All Employees|medium;Amount of Time for Binary Tree to Be Infected|medium;Find Duplicate Subtrees|medium;Delete Nodes And Return Forest|medium;Binary Tree Maximum Path Sum|hard;Binary Tree Cameras|hard;Sum of Distances in Tree|hard;Count Subtrees With Max Distance Between Cities|hard;Smallest Missing Genetic Value in Each Subtree|hard;Number of Ways to Reorder Array to Get Same BST|hard;Minimum Edge Weight Equilibrium Queries in a Tree|hard`,
  "Digit DP": `Add Digits|easy;Happy Number|easy;Rotated Digits|medium;Strobogrammatic Number II|medium|strobogrammatic-number-ii;Count Numbers with Unique Digits|medium;Next Greater Element III|medium;Integer Replacement|medium;Nth Digit|medium;Number of Digit One|hard;Numbers At Most N Given Digit Set|hard;Non-negative Integers without Consecutive Ones|hard;Count Special Integers|hard;Count of Integers|hard;Count Stepping Numbers in Range|hard;Find All Good Strings|hard;Confusing Number II|hard|confusing-number-ii;Strobogrammatic Number III|hard|strobogrammatic-number-iii;Digit Count in Range|hard|digit-count-in-range;Super Palindromes|hard;Count the Number of Powerful Integers|hard`,
  "Bitmask DP": `Subsets|medium;Subsets II|medium;Permutations|medium;Maximum Product of Word Lengths|medium;Partition to K Equal Sum Subsets|medium;Matchsticks to Square|medium;Can I Win|medium;Beautiful Arrangement|medium;Minimum Number of Work Sessions to Finish the Tasks|medium;Shortest Path Visiting All Nodes|hard;Smallest Sufficient Team|hard;Number of Ways to Wear Different Hats to Each Other|hard;Parallel Courses II|hard;Maximum Students Taking Exam|hard;Minimum Cost to Connect Two Groups of Points|hard;Find the Shortest Superstring|hard;Stickers to Spell Word|hard;Maximum AND Sum of Array|hard;The Number of Good Subsets|hard;Minimum Incompatibility|hard`,
  "Trie": `Implement Trie (Prefix Tree)|medium;Design Add and Search Words Data Structure|medium;Replace Words|medium;Map Sum Pairs|medium;Maximum XOR of Two Numbers in an Array|medium;Search Suggestions System|medium;Longest Word in Dictionary|medium;Camelcase Matching|medium;Implement Magic Dictionary|medium;Short Encoding of Words|medium;Extra Characters in a String|medium;Word Search II|hard;Word Squares|hard|word-squares;Palindrome Pairs|hard;Stream of Characters|hard;Concatenated Words|hard;Prefix and Suffix Search|hard;Delete Duplicate Folders in System|hard;Sum of Prefix Scores of Strings|hard;Maximum Strong Pair XOR II|hard`,
  "Backtracking": `Subsets|medium;Subsets II|medium;Permutations|medium;Permutations II|medium;Combinations|medium;Combination Sum|medium;Combination Sum II|medium;Combination Sum III|medium;Letter Combinations of a Phone Number|medium;Generate Parentheses|medium;Palindrome Partitioning|medium;Word Search|medium;Restore IP Addresses|medium;Beautiful Arrangement|medium;The K-th Lexicographical String of All Happy Strings of Length n|medium;N-Queens|hard;N-Queens II|hard;Sudoku Solver|hard;Expression Add Operators|hard;Remove Invalid Parentheses|hard`,
  "Two Heaps": `Last Stone Weight|easy;Kth Largest Element in a Stream|easy;Kth Largest Element in an Array|medium;Top K Frequent Elements|medium;Find K Pairs with Smallest Sums|medium;Meeting Rooms II|medium|meeting-rooms-ii;Task Scheduler|medium;Reorganize String|medium;Distant Barcodes|medium;Process Tasks Using Servers|medium;Single-Threaded CPU|medium;Seat Reservation Manager|medium;Find Median from Data Stream|hard;Sliding Window Median|hard;IPO|hard;The Skyline Problem|hard;Smallest Range Covering Elements from K Lists|hard;Maximum Performance of a Team|hard;Minimum Cost to Hire K Workers|hard;Minimum Number of Refueling Stops|hard`,
  "Bit Manipulation": `Single Number|easy;Number of 1 Bits|easy;Counting Bits|easy;Reverse Bits|easy;Power of Two|easy;Missing Number|easy;Sum of Two Integers|medium;Single Number II|medium;Single Number III|medium;Bitwise AND of Numbers Range|medium;Maximum Product of Word Lengths|medium;UTF-8 Validation|medium;Total Hamming Distance|medium;Find the Duplicate Number|medium;Maximum XOR of Two Numbers in an Array|medium;Integer Replacement|medium;Minimum Flips to Make a OR b Equal to c|medium;Minimum Number of Operations to Make Array XOR Equal to K|medium;Minimum One Bit Operations to Make Integers Zero|hard;Maximum AND Sum of Array|hard`,
  "Greedy Patterns": `Assign Cookies|easy;Lemonade Change|easy;Best Time to Buy and Sell Stock II|medium;Jump Game|medium;Jump Game II|medium;Gas Station|medium;Queue Reconstruction by Height|medium;Partition Labels|medium;Non-overlapping Intervals|medium;Minimum Number of Arrows to Burst Balloons|medium;Task Scheduler|medium;Reorganize String|medium;Hand of Straights|medium;Dota2 Senate|medium;Minimum Deletions to Make Character Frequencies Unique|medium;Candy|hard;Maximum Performance of a Team|hard;Minimum Cost to Hire K Workers|hard;Course Schedule III|hard;Create Maximum Number|hard`,
  "Segment Tree / BIT": `Range Sum Query - Mutable|medium;Range Sum Query 2D - Mutable|medium|range-sum-query-2d-mutable;My Calendar I|medium;My Calendar II|medium;Count of Smaller Numbers After Self|hard;Reverse Pairs|hard;Count of Range Sum|hard;The Skyline Problem|hard;Falling Squares|hard;My Calendar III|hard;Range Module|hard;Create Sorted Array through Instructions|hard;Handling Sum Queries After Update|hard;Longest Increasing Subsequence II|hard;Maximum Sum Queries|hard;Count Integers in Intervals|hard;Number of Flowers in Full Bloom|hard;Booking Concert Tickets in Groups|hard;Block Placement Queries|hard|block-placement-queries;Count the Number of Inversions|hard`,
  "Design Data Structures": `Design HashMap|easy;Design HashSet|easy;Min Stack|medium;LRU Cache|medium;Insert Delete GetRandom O(1)|medium|insert-delete-getrandom-o1;Randomized Collection|hard|insert-delete-getrandom-o1-duplicates-allowed;Time Based Key-Value Store|medium;Snapshot Array|medium;Design Browser History|medium;Design Underground System|medium;Design Twitter|medium;Design Circular Queue|medium;Design Circular Deque|medium;Design Add and Search Words Data Structure|medium;Implement Trie (Prefix Tree)|medium;Find Median from Data Stream|hard;LFU Cache|hard;All O'one Data Structure|hard|all-oone-data-structure;Range Module|hard;Data Stream as Disjoint Intervals|hard`
};

for (const [pattern, rows] of Object.entries(EXPANDED_PROBLEM_ROWS)) {
  PROBLEMS_DB[pattern] = rows.split(";").filter(Boolean).map(parseProblemRow);
}

function validateProblemRows(){
  let invalidRows = Object.entries(PROBLEMS_DB).filter(([, problems]) => problems.length !== 20);
  if(invalidRows.length){
    console.warn("Each pattern should contain 20 problems. Check:", invalidRows.map(([name, problems]) => `${name}: ${problems.length}`).join(", "));
  }
}
validateProblemRows();

// Phase definitions
const PHASES_DATA = [
  { id:1, label:"Phase 1 - Foundation", color:"#3B8BD4", patterns:["Two Pointers","Sliding Window","Prefix Sum","Cyclic Sort","Linked List","Stack / Queue Basics"] },
  { id:2, label:"Phase 2 - Core Interview", color:"#1D9E75", patterns:["Binary Search (Extended)","HashMap Patterns","Merge Intervals","Monotonic Stack","Monotonic Deque"] },
  { id:3, label:"Phase 3 - Trees & Graphs", color:"#EF9F27", patterns:["Tree DFS - 4 subtypes","Tree BFS / Level Order","BST Patterns","Graph BFS Patterns","Graph DFS Patterns","Topological Sort","Union-Find (DSU)","Shortest Path Patterns"] },
  { id:4, label:"Phase 4 - Dynamic Programming", color:"#D4537E", patterns:["1D DP - Linear","0/1 Knapsack","Unbounded Knapsack","LCS Family","LIS Family","DP on Grids","Palindrome DP","Interval DP","DP on Trees","Digit DP","Bitmask DP"] },
  { id:5, label:"Phase 5 - Advanced", color:"#7F77DD", patterns:["Trie","Backtracking","Two Heaps","Bit Manipulation","Greedy Patterns","Segment Tree / BIT","Design Data Structures"] }
];

function getPatternId(patternName, fallbackId){
  return Object.prototype.hasOwnProperty.call(LEGACY_PATTERN_IDS, patternName) ? LEGACY_PATTERN_IDS[patternName] : fallbackId;
}

function getLegacyProblemStorageKeys(patternName, problem, idx){
  let patternId = LEGACY_PATTERN_IDS[patternName];
  if(patternId === undefined) return [];

  let hasExplicitLegacyRow = Object.prototype.hasOwnProperty.call(LEGACY_PROBLEM_ROWS_FOR_MIGRATION, patternName);
  let keys = [];

  if(hasExplicitLegacyRow){
    let legacyIdx = LEGACY_PROBLEM_INDEX.get(`${patternName}::title::${problem.title}`);
    if(legacyIdx === undefined) legacyIdx = LEGACY_PROBLEM_INDEX.get(`${patternName}::slug::${problem.slug}`);
    if(legacyIdx !== undefined) keys.push(`${patternId}_${patternName}_${legacyIdx}`);
  } else {
    keys.push(`${patternId}_${patternName}_${idx}`);
  }

  return [...new Set(keys)];
}

function storageKeyForProblem(pattern, problem){
  return `${problemSlug(pattern.name)}::${problem.slug || problemSlug(problem.title)}`;
}

function getSavedValue(container, primaryKey, legacyKeys){
  if(!container) return undefined;
  if(Object.prototype.hasOwnProperty.call(container, primaryKey)) return container[primaryKey];
  for(let legacyKey of legacyKeys || []){
    if(Object.prototype.hasOwnProperty.call(container, legacyKey)) return container[legacyKey];
  }
  return undefined;
}

// Build pattern library
let patternsLibrary = [];
let fallbackPatternId = Math.max(...Object.values(LEGACY_PATTERN_IDS)) + 1;
let usedPatternIds = new Set();

for(let phase of PHASES_DATA){
  for(let pname of phase.patterns){
    let assignedId = getPatternId(pname, fallbackPatternId);
    if(!Object.prototype.hasOwnProperty.call(LEGACY_PATTERN_IDS, pname)) fallbackPatternId++;
    if(usedPatternIds.has(assignedId)) console.warn(`Duplicate pattern id detected for ${pname}: ${assignedId}`);
    usedPatternIds.add(assignedId);

    let probs = PROBLEMS_DB[pname] || [{ title:`Practice ${pname}`, url:"#", difficulty:"medium", slug:problemSlug(`Practice ${pname}`) }];
    patternsLibrary.push({
      id: assignedId,
      name: pname,
      phase: phase.id,
      phaseLabel: phase.label,
      color: phase.color,
      problems: probs.map((p, idx) => ({
        id: `${pname}_${idx}`,
        title: p.title,
        slug: p.slug || problemSlug(p.title),
        url: p.url,
        difficulty: p.difficulty,
        completed: false,
        tags: [],
        notes: "",
        videoUrl: "",
        legacyStorageKeys: getLegacyProblemStorageKeys(pname, p, idx)
      }))
    });
  }
}

function setSyncStatus(message, state = "idle"){
  let el = document.getElementById(SYNC_STATUS_ID);
  if(!el) return;
  el.textContent = message;
  el.dataset.state = state;
}

function problemKey(pattern, problem){
  return `${pattern.name}::${problem.title}`;
}

const SHEET_PROBLEM_ID_ALIASES = Object.freeze({
  "Topological Sort::Recipe from Supplies": "Topological Sort::Find All Possible Recipes from Given Supplies",
  "Topological Sort::Minimum Time to Complete All Courses": "Topological Sort::Parallel Courses III",
  "Unbounded Knapsack::Largest Number": "Unbounded Knapsack::Form Largest Integer With Digits That Add up to Target",
  "LIS Family::Longest Obstacle Course at Each Position": "LIS Family::Find the Longest Valid Obstacle Course at Each Position",
  "Interval DP::Merge Stones": "Interval DP::Minimum Cost to Merge Stones",
  "Segment Tree / BIT::NumMatrix": "Segment Tree / BIT::Range Sum Query 2D - Mutable"
});

function buildProgressRecordMap(records){
  let byId = new Map();
  for(let item of records || []){
    if(!item || !item.problemId) continue;
    byId.set(item.problemId, item);
    let alias = SHEET_PROBLEM_ID_ALIASES[item.problemId];
    if(alias && !byId.has(alias)) byId.set(alias, item);
  }
  return byId;
}

function snapshotProgress(){
  let records = [];
  for(let pattern of patternsLibrary){
    for(let problem of pattern.problems){
      let customTags = problem.tags.filter(t => !["easy", "medium", "hard"].includes(t));
      if(problem.completed || customTags.length || problem.notes || problem.videoUrl){
        records.push({
          problemId: problemKey(pattern, problem),
          pattern: pattern.name,
          title: problem.title,
          completed: problem.completed,
          tags: customTags.join(", "),
          notes: problem.notes || "",
          videoUrl: problem.videoUrl || "",
          updatedAt: new Date().toISOString()
        });
      }
    }
  }
  return records;
}

function applyProgressRecords(records){
  let byId = buildProgressRecordMap(records);
  for(let pattern of patternsLibrary){
    for(let problem of pattern.problems){
      let saved = byId.get(problemKey(pattern, problem));
      if(!saved) continue;
      problem.completed = parseCompleted(saved.completed);
      problem.notes = saved.notes || "";
      problem.videoUrl = saved.videoUrl || "";
      problem.tags = saved.tags ? saved.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    }
  }
}

async function loadFromSheets(){
  if(!SHEETS_API_URL) return false;
  try{
    setSyncStatus("Syncing...", "pending");
    let response = await fetch(SHEETS_API_URL);
    if(!response.ok) throw new Error(`Load failed: ${response.status}`);
    let data = await response.json();
    applyProgressRecords(data.records || []);
    setSyncStatus("Synced with Google Sheets", "ok");
    return true;
  } catch(error){
    console.warn(error);
    setSyncStatus("Using local backup", "error");
    return false;
  }
}

async function saveToSheets(){
  if(!SHEETS_API_URL) {
    setSyncStatus("Local only");
    return;
  }
  try{
    setSyncStatus("Saving...", "pending");
    await fetch(SHEETS_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ records: snapshotProgress() })
    });
    setSyncStatus("Saved to Google Sheets", "ok");
  } catch(error){
    console.warn(error);
    setSyncStatus("Save failed. Local backup kept.", "error");
  }
}

function queueSheetsSave(){
  if(syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(saveToSheets, 600);
}

// State, localStorage fallback, and optional Google Sheets sync.
let appState = { selectedPatternId: null, problemStatus: {}, extraTags: {} };

function readLocalState(){
  let stored = localStorage.getItem(STATE_KEY);
  if(!stored) return { problemStatus: {}, extraTags: {} };
  try{
    let data = JSON.parse(stored);
    return {
      problemStatus: data.problemStatus || {},
      extraTags: data.extraTags || {}
    };
  } catch(error){
    console.warn("Could not parse local DSA state. Starting from a clean local state.", error);
    return { problemStatus: {}, extraTags: {} };
  }
}

function applySavedLocalStateToProblem(pattern, problem){
  let primaryKey = storageKeyForProblem(pattern, problem);
  let legacyKeys = problem.legacyStorageKeys || [];
  let savedStatus = getSavedValue(appState.problemStatus, primaryKey, legacyKeys);
  let savedTags = getSavedValue(appState.extraTags, primaryKey, legacyKeys);

  if(savedStatus){
    problem.completed = parseCompleted(savedStatus.completed);
    problem.notes = savedStatus.notes || "";
    problem.videoUrl = savedStatus.videoUrl || "";
  }

  if(Array.isArray(savedTags)){
    problem.tags = [...new Set([...problem.tags, ...savedTags])];
  }

  if(!appState.problemStatus[primaryKey]){
    appState.problemStatus[primaryKey] = {
      completed: problem.completed,
      notes: problem.notes,
      videoUrl: problem.videoUrl
    };
  }
}

async function loadState(){
  let data = readLocalState();
  appState.problemStatus = data.problemStatus;
  appState.extraTags = data.extraTags;

  for(let pat of patternsLibrary){
    for(let prob of pat.problems){
      applySavedLocalStateToProblem(pat, prob);
    }
  }

  await loadFromSheets();
  renderAll();
  updateChart();
}

function persist(){
  let nextProblemStatus = {};
  let nextExtraTags = {};

  for(let pat of patternsLibrary){
    for(let prob of pat.problems){
      let key = storageKeyForProblem(pat, prob);
      nextProblemStatus[key] = {
        completed: prob.completed,
        notes: prob.notes,
        videoUrl: prob.videoUrl
      };

      let customTags = prob.tags.filter(t => !["easy", "medium", "hard"].includes(t));
      if(customTags.length) nextExtraTags[key] = [...new Set(customTags)];
    }
  }

  appState.problemStatus = nextProblemStatus;
  appState.extraTags = nextExtraTags;
  localStorage.setItem(STATE_KEY, JSON.stringify({ problemStatus: appState.problemStatus, extraTags: appState.extraTags }));
  queueSheetsSave();
  updateChart();
}

function toggleProblemCompleted(pattern, problem){
  problem.completed = !problem.completed;
  persist();
  renderProblemList(pattern);
  renderAllPatterns();
  updateChart();
}

function renderAllPatterns(){
  let container = document.getElementById("phasesContainer");
  if(!container) return;

  let searchTerm = document.getElementById("globalSearch")?.value.toLowerCase() || "";
  let filtered = patternsLibrary.filter(p =>
    p.name.toLowerCase().includes(searchTerm) ||
    p.problems.some(pr => pr.title.toLowerCase().includes(searchTerm))
  );

  let map = new Map();
  for(let p of filtered){
    if(!map.has(p.phase)) map.set(p.phase, { phaseId:p.phase, label:p.phaseLabel, color:p.color, patterns:[] });
    map.get(p.phase).patterns.push(p);
  }

  let html = "";
  for(let ph of map.values()){
    let totalProb = ph.patterns.reduce((a, pat) => a + pat.problems.length, 0);
    let solvedProb = ph.patterns.reduce((a, pat) => a + pat.problems.filter(pr => pr.completed).length, 0);
    html += `<div class="phase-block"><div class="phase-header" onclick="togglePhaseGrid(this)"><div class="phase-dot" style="background:${escapeHtml(ph.color)}"></div><div class="phase-title">${escapeHtml(ph.label)}</div><div class="phase-progress">${solvedProb}/${totalProb} solved</div><i class="ti ti-chevron-down"></i></div><div class="pattern-grid" style="display:grid;">`;

    for(let pat of ph.patterns){
      let solved = pat.problems.filter(p => p.completed).length;
      let total = pat.problems.length;
      let checkedAttr = (solved === total && total > 0) ? "checked" : "";
      let percent = total ? Math.round((solved / total) * 100) : 0;
      html += `<div class="pattern-card ${appState.selectedPatternId === pat.id ? "selected" : ""}" data-pattern-id="${pat.id}"><div class="pattern-title-row"><strong>${escapeHtml(pat.name)}</strong><span class="text-small pattern-count">${solved}/${total}</span></div><label class="pattern-check" onclick="event.stopPropagation();"><input type="checkbox" class="pattern-master-check" data-id="${pat.id}" ${checkedAttr} onchange="togglePatternMaster(${pat.id})"><span class="text-small">Mark all solved</span></label><div class="pattern-progress"><div class="pattern-progress-meta"><span class="text-small">Progress</span><span class="text-small">${percent}%</span></div><div class="pattern-progress-track"><div class="pattern-progress-fill" style="width:${percent}%"></div></div></div></div>`;
    }

    html += `</div></div>`;
  }

  container.innerHTML = html;
  document.querySelectorAll(".pattern-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if(e.target.tagName !== "INPUT"){
        appState.selectedPatternId = parseInt(card.dataset.patternId, 10);
        renderAllPatterns();
        renderProblemList(patternsLibrary.find(p => p.id === appState.selectedPatternId));
      }
    });
  });
}

function togglePatternMaster(pid){
  let pattern = patternsLibrary.find(p => p.id === pid);
  if(!pattern) return;
  let newState = !pattern.problems.every(p => p.completed);
  pattern.problems.forEach(p => p.completed = newState);
  persist();
  renderAllPatterns();
  if(appState.selectedPatternId === pid) renderProblemList(pattern);
  updateChart();
}

function renderProblemList(pattern){
  let container = document.getElementById("problemListContainer");
  let selectedName = document.getElementById("selectedPatternName");
  let patternStats = document.getElementById("patternStats");
  if(!container) return;

  if(!pattern){
    container.innerHTML = '<div class="empty-state">📌 Select a pattern to start solving</div>';
    if(selectedName) selectedName.innerText = "No pattern selected";
    if(patternStats) patternStats.innerText = "0/0";
    return;
  }

  if(selectedName) selectedName.innerHTML = `🧩 ${escapeHtml(pattern.name)}`;
  let solved = pattern.problems.filter(p => p.completed).length;
  if(patternStats) patternStats.innerHTML = `${solved}/${pattern.problems.length} solved`;

  let html = "";
  pattern.problems.forEach((prob) => {
    let diffClass = normalizeDifficulty(prob.difficulty);
    let tagsHtml = prob.tags
      .filter(t => !["easy", "medium", "hard"].includes(t))
      .map(t => `<span class="tag">${escapeHtml(t)}</span>`)
      .join("");

    // Use pure emojis – no external fonts needed
    let noteEmoji = prob.notes ? "📝" : "📄";
    let videoEmoji = prob.videoUrl ? "🎥" : "🎬";
    let tagEmoji = "🏷️";

    let escapedProbId = escapeJsString(prob.id);

    html += `<div class="problem-row">
      <div class="prob-check"><input type="checkbox" ${prob.completed ? "checked" : ""} onchange="toggleProblemCompletedById(${pattern.id},'${escapedProbId}')"></div>
      <div class="prob-title"><a href="${escapeHtml(prob.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(prob.title)} 🔗</a></div>
      <div class="difficulty ${diffClass}">${escapeHtml(prob.difficulty)}</div>
      <div class="tag-group">${tagsHtml}</div>
      <div class="inline-edit">
        <button onclick="promptTag(${pattern.id},'${escapedProbId}')" title="Add or edit tags">${tagEmoji}</button>
        <button onclick="promptNote(${pattern.id},'${escapedProbId}')" title="Add or edit note">${noteEmoji}</button>
        <button onclick="promptVideo(${pattern.id},'${escapedProbId}')" title="Add or edit video URL">${videoEmoji}</button>
      </div>
    </div>`;
  });

  container.innerHTML = html;
}

window.toggleProblemCompletedById = (pid, probId) => {
  let pat = patternsLibrary.find(p => p.id === pid);
  if(!pat) return;
  let prob = pat.problems.find(p => p.id === probId);
  if(prob) toggleProblemCompleted(pat, prob);
};

window.promptTag = (pid, probId) => {
  let pat = patternsLibrary.find(p => p.id === pid);
  if(!pat) return;
  let prob = pat.problems.find(p => p.id === probId);
  if(!prob) return;
  let newTag = prompt("Add tag (e.g. 'two-pointer', 'sliding-window'):");
  if(newTag) {
    prob.tags = [...new Set([...prob.tags, newTag.trim()].filter(Boolean))];
    persist();
    renderProblemList(pat);
    renderAllPatterns();
  }
};

window.promptNote = (pid, probId) => {
  let pat = patternsLibrary.find(p => p.id === pid);
  if(!pat) return;
  let prob = pat.problems.find(p => p.id === probId);
  if(!prob) return;
  let note = prompt("Add notes / solution insight:", prob.notes);
  if(note !== null) {
    prob.notes = note;
    persist();
    renderProblemList(pat);
  }
};

window.promptVideo = (pid, probId) => {
  let pat = patternsLibrary.find(p => p.id === pid);
  if(!pat) return;
  let prob = pat.problems.find(p => p.id === probId);
  if(!prob) return;
  let url = prompt("Add video / resource URL:", prob.videoUrl);
  if(url !== null) {
    let cleanUrl = safeExternalUrl(url);
    if(url.trim() && !cleanUrl){
      alert("Please enter a valid http or https URL.");
      return;
    }
    prob.videoUrl = cleanUrl;
    persist();
    renderProblemList(pat);
  }
};

window.togglePhaseGrid = (header) => {
  let grid = header.nextElementSibling;
  let icon = header.querySelector(".ti-chevron-down");
  if(!grid) return;
  if(grid.style.display === "none"){
    grid.style.display = "grid";
    if(icon) icon.style.transform = "rotate(0deg)";
  } else {
    grid.style.display = "none";
    if(icon) icon.style.transform = "rotate(-90deg)";
  }
};

function updateChart(){
  let solved = 0;
  let total = 0;

  patternsLibrary.forEach(p => {
    p.problems.forEach(prob => {
      total++;
      if(prob.completed) solved++;
    });
  });

  let totalSolvedEl = document.getElementById("totalSolved");
  let totalProblemsEl = document.getElementById("totalProblems");
  if(totalSolvedEl) totalSolvedEl.innerText = solved;
  if(totalProblemsEl) totalProblemsEl.innerText = total;

  let canvas = document.getElementById("progressChart");
  if(!canvas || typeof Chart === "undefined") return;

  if(chart) chart.destroy();
  let ctx = canvas.getContext("2d");
  if(!ctx) return;

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Solved", "Remaining"],
      datasets: [{
        data: [solved, total - solved],
        backgroundColor: ["#3b82f6", isNightMode() ? "#29354a" : "#e2e8f0"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "60%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: isNightMode() ? "#cbd5e1" : "#334155",
            boxWidth: 10,
            font: { size: 9 }
          }
        }
      }
    }
  });
}

function renderAll(){
  renderAllPatterns();
  if(appState.selectedPatternId !== null){
    let selected = patternsLibrary.find(p => p.id === appState.selectedPatternId);
    if(selected) renderProblemList(selected);
    else {
      let container = document.getElementById("problemListContainer");
      if(container) container.innerHTML = '<div class="empty-state">Select a pattern</div>';
    }
  } else {
    let container = document.getElementById("problemListContainer");
    if(container) container.innerHTML = '<div class="empty-state">Click any pattern to start solving</div>';
  }
  updateChart();
}

let themeToggle = document.getElementById("themeToggle");
if(themeToggle) themeToggle.addEventListener("click", toggleTheme);

let globalSearch = document.getElementById("globalSearch");
if(globalSearch) globalSearch.addEventListener("input", () => renderAllPatterns());

loadState();