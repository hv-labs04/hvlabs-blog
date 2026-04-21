---
title: "Dynamic Programming Basics"
slug: "dynamic-programming-basics"
date: "2024-03-05"
description: "How to recognize DP problems, break them into subproblems, and write clean top-down and bottom-up solutions"
tags: ["dsa", "dynamic-programming", "dp", "algorithms", "patterns"]
featured: false
draft: false
module: "algorithm-patterns"
moduleOrder: 2
---

Dynamic programming is the interview topic most people find hardest. Not because it requires complex math, but because it requires a different way of thinking — breaking a problem into overlapping subproblems and recognizing that you've solved them before.

## What Is DP?

Dynamic programming applies when a problem has two properties:

1. **Optimal substructure**: the optimal solution to the problem is built from optimal solutions to subproblems
2. **Overlapping subproblems**: the same subproblems appear multiple times in a naive recursive solution

If you draw the recursion tree of a naive solution and see repeated nodes, DP is the answer. Memoize those repeated calls.

## Fibonacci: The Minimal Example

Naive recursion recalculates the same values repeatedly:

```python
def fib(n):  # O(2^n) — each call branches twice
    if n <= 1: return n
    return fib(n-1) + fib(n-2)
```

**Top-down (memoization)**: cache results so each subproblem is solved once:

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):  # O(n) time, O(n) space
    if n <= 1: return n
    return fib(n-1) + fib(n-2)
```

**Bottom-up (tabulation)**: build the table from smallest subproblems upward:

```python
def fib(n):  # O(n) time, O(1) space
    if n <= 1: return n
    a, b = 0, 1
    for _ in range(2, n+1):
        a, b = b, a + b
    return b
```

Bottom-up often allows further space optimization when you only need the last few states.

## The Framework

For any DP problem:

1. **Define the state** — what does `dp[i]` or `dp[i][j]` represent?
2. **Write the recurrence** — how does `dp[i]` relate to earlier states?
3. **Identify base cases** — what are the trivially known values?
4. **Determine evaluation order** — ensure you've computed dependencies before you need them

## 1D DP: Climbing Stairs / Coin Change

**Coin change** — minimum coins to reach amount `n`:

```python
def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0  # base case: 0 coins to make amount 0
    for a in range(1, amount + 1):
        for coin in coins:
            if a - coin >= 0:
                dp[a] = min(dp[a], dp[a - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1
```

State: `dp[a]` = minimum coins to make amount `a`  
Recurrence: `dp[a] = min(dp[a - coin] + 1)` for each valid coin  
Base case: `dp[0] = 0`

## 2D DP: Longest Common Subsequence

LCS is the prototypical 2D DP:

```python
def lcs(s, t):
    m, n = len(s), len(t)
    dp = [[0] * (n+1) for _ in range(m+1)]
    for i in range(1, m+1):
        for j in range(1, n+1):
            if s[i-1] == t[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]
```

State: `dp[i][j]` = LCS length of `s[:i]` and `t[:j]`  
Recurrence: match → extend by 1; no match → best of either string shortened

## Knapsack (Bounded Choice)

The 0/1 knapsack: each item can be included at most once.

```python
def knapsack(weights, values, capacity):
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for w in range(capacity + 1):
            dp[i][w] = dp[i-1][w]  # don't take item i
            if weights[i-1] <= w:
                dp[i][w] = max(dp[i][w], dp[i-1][w - weights[i-1]] + values[i-1])
    return dp[n][capacity]
```

The key insight: when iterating over items, a 2D table ensures each item is considered only once. For unbounded knapsack (items can repeat), a 1D array iterated forward works.

## Recognizing DP Problems

Watch for these phrases in problem statements:
- "minimum/maximum number of ways"
- "can you achieve X" (existence of an optimal path)
- "number of distinct ways"
- "longest/shortest subsequence/substring"

And these structural clues:
- Problem involves sequences and you're making choices at each step
- Future choices don't affect the validity of past choices (optimal substructure)
- Brute force is exponential, suggesting massive overlap

## Top-Down vs Bottom-Up

| | Top-Down (Memo) | Bottom-Up (Tabulation) |
|--|-----------------|------------------------|
| Code style | Recursive + cache | Iterative + table |
| Subproblems computed | Only needed ones | All of them |
| Space optimization | Harder | Easy (rolling array) |
| Natural for | Trees/graphs | Linear sequences |

For interviews, top-down is usually faster to write correctly. For space-optimal solutions, bottom-up lets you drop old rows.

## Common DP Problems by Category

| Category | Representative Problems |
|----------|------------------------|
| Linear DP | Climbing stairs, house robber, jump game |
| 2D/Grid | Unique paths, minimum path sum, edit distance |
| Sequence | LCS, LIS, coin change |
| Interval DP | Burst balloons, palindrome partitioning |
| Knapsack | Subset sum, partition equal subset, target sum |

## Summary

DP is hard to learn because the key step — defining the state and recurrence — requires insight that comes from practice, not rules. But the implementation is always the same: define what `dp[i]` means, write the recurrence, handle base cases, and iterate in dependency order. Solve enough examples and the pattern recognition becomes automatic.
