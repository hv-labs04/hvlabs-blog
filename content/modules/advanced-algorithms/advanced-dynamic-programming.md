---
title: "Advanced Dynamic Programming"
slug: "advanced-dynamic-programming"
date: "2024-04-05"
description: "Interval DP, bitmask DP, and digit DP — the specialized DP patterns that appear in harder interview problems"
tags: ["dsa", "dynamic-programming", "dp", "advanced", "algorithms"]
featured: false
draft: false
module: "advanced-algorithms"
moduleOrder: 2
---

Once you've mastered linear and 2D DP, a few specialized patterns appear repeatedly in harder problems. Each has a structural tell that, once recognized, makes the solution almost mechanical.

## Interval DP

Interval DP solves problems over contiguous sub-arrays by building solutions from shorter intervals to longer ones. The classic example is the **matrix chain multiplication** or **burst balloons**.

**Burst Balloons**: given an array of balloons with values, burst them to maximize coins. Bursting balloon `k` between `i` and `j` gives `nums[i] * nums[k] * nums[j]` coins.

The key insight: instead of thinking about which balloon to burst *first*, think about which one to burst *last*. If `k` is the last to burst in the range `(i, j)`, then at the moment of bursting, its only neighbors are `i` and `j` (all others are already gone):

```python
def max_coins(nums):
    nums = [1] + nums + [1]  # boundary sentinels
    n = len(nums)
    dp = [[0] * n for _ in range(n)]

    for length in range(2, n):          # interval length
        for left in range(0, n - length):
            right = left + length
            for k in range(left + 1, right):  # last balloon in (left, right)
                coins = nums[left] * nums[k] * nums[right]
                dp[left][right] = max(dp[left][right],
                                      dp[left][k] + coins + dp[k][right])
    return dp[0][n-1]
```

State: `dp[i][j]` = maximum coins from bursting all balloons strictly between `i` and `j`  
Order: iterate by increasing interval length

Other interval DP problems: palindrome partitioning, stone merging, optimal BST construction.

## Bitmask DP

When the state space involves subsets of a small set (n ≤ 20), represent subsets as bitmasks and use DP over all 2ⁿ subsets.

**Travelling Salesman Problem (TSP)**: find the shortest Hamiltonian cycle. O(2ⁿ · n²) with bitmask DP:

```python
def tsp(dist, n):
    INF = float('inf')
    dp = [[INF] * n for _ in range(1 << n)]
    dp[1][0] = 0  # start at node 0, visited = {0}

    for mask in range(1 << n):
        for u in range(n):
            if dp[mask][u] == INF: continue
            if not (mask >> u & 1): continue  # u not in current set
            for v in range(n):
                if mask >> v & 1: continue  # v already visited
                new_mask = mask | (1 << v)
                dp[new_mask][v] = min(dp[new_mask][v], dp[mask][u] + dist[u][v])

    # Return to start
    full_mask = (1 << n) - 1
    return min(dp[full_mask][u] + dist[u][0] for u in range(n))
```

Bit operations:
- `mask | (1 << v)` → add v to set
- `mask & ~(1 << v)` → remove v from set  
- `(mask >> v) & 1` → check if v is in set

**Minimum number of people to cover all skills**: assign k people, each with a subset of skills, to cover all n skills. Bitmask DP over skill subsets finds the minimum people needed.

## Digit DP

Count integers in `[L, R]` satisfying some digit-by-digit property (divisibility, digit sum, no repeated digits). Build the number digit by digit from most significant to least:

```python
from functools import lru_cache

def count_numbers_with_property(n):
    """Count integers in [1, n] whose digits sum to a multiple of 3"""
    digits = list(map(int, str(n)))
    
    @lru_cache(maxsize=None)
    def dp(pos, remainder, tight, started):
        if pos == len(digits):
            return 1 if started and remainder == 0 else 0
        limit = digits[pos] if tight else 9
        result = 0
        for d in range(0 if started else 1, limit + 1):
            result += dp(
                pos + 1,
                (remainder + d) % 3,
                tight and d == limit,
                started or d > 0
            )
        return result

    return dp(0, 0, True, False)
```

State parameters:
- `pos` — current digit position
- `remainder` (or whatever property) — accumulated state so far
- `tight` — are we still bounded by the original number's digits?
- `started` — have we placed any non-zero digit yet? (handles leading zeros)

## DP on Trees

Tree DP computes a value for each subtree bottom-up. A common pattern: for each node, compute an answer assuming the node is/isn't included:

```python
def rob_tree(root):
    """House robber on a tree — can't rob adjacent nodes"""
    def dfs(node):
        if not node:
            return 0, 0  # (rob_this, skip_this)
        left_rob, left_skip = dfs(node.left)
        right_rob, right_skip = dfs(node.right)
        rob_this = node.val + left_skip + right_skip
        skip_this = max(left_rob, left_skip) + max(right_rob, right_skip)
        return rob_this, skip_this

    return max(dfs(root))
```

## DP with Monotonic Queue (Optimization)

Some DP recurrences of the form `dp[i] = min(dp[j] + cost(j, i))` for j < i can be optimized from O(n²) to O(n) using a monotonic deque to track the optimal j.

This applies when `cost(j, i)` has a specific structure (like the "convex hull trick" when cost is linear in j). The pattern appears in problems like "minimum cost to jump" or "divide array with minimum cost."

## Summary

Advanced DP problems usually come down to: (1) finding the right state definition, (2) recognizing which specialized pattern applies. Interval DP — iterate by length, think "what's last." Bitmask DP — small sets, represent as integers. Digit DP — count numbers with properties by building digit by digit. Tree DP — return a tuple of results for each subtree.
