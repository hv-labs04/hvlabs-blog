---
title: "Greedy Algorithms"
slug: "greedy-algorithms"
date: "2024-03-12"
description: "Making locally optimal choices at each step — when greedy works, when it doesn't, and how to prove correctness"
tags: ["dsa", "greedy", "algorithms", "patterns"]
featured: false
draft: false
module: "algorithm-patterns"
moduleOrder: 4
---

A greedy algorithm makes the locally optimal choice at each step with the hope — and sometimes the proof — that local optima accumulate to a global optimum. When greedy works, it's elegant and fast. The hard part is knowing when it's safe to use it.

## When Greedy Works

Greedy is valid when the problem has the **greedy choice property**: a globally optimal solution can always be built by making a locally optimal choice at each step. This is often proven by an "exchange argument" — assume an optimal solution doesn't make the greedy choice, then show you can swap in the greedy choice without making things worse.

The classic example is activity selection: given a set of intervals, find the maximum number of non-overlapping intervals you can attend.

**Greedy choice**: always pick the interval that ends earliest.

**Intuition**: by finishing as early as possible, you leave maximum room for future intervals.

```python
def max_non_overlapping(intervals):
    intervals.sort(key=lambda x: x[1])  # sort by end time
    count, end = 0, float('-inf')
    for start, finish in intervals:
        if start >= end:
            count += 1
            end = finish
    return count
```

## Classic Greedy Problems

### Jump Game

Can you reach the last index? At each position, track the farthest reachable index:

```python
def can_jump(nums):
    reach = 0
    for i, jump in enumerate(nums):
        if i > reach:
            return False  # i is unreachable
        reach = max(reach, i + jump)
    return True
```

Greedy: always extend `reach` as far as possible. If `reach` stalls before the end, you're stuck.

### Gas Station

Find a circular starting point where you can complete the loop:

```python
def can_complete_circuit(gas, cost):
    total_tank = current_tank = start = 0
    for i in range(len(gas)):
        gain = gas[i] - cost[i]
        total_tank += gain
        current_tank += gain
        if current_tank < 0:
            start = i + 1   # greedy: start fresh after failure
            current_tank = 0
    return start if total_tank >= 0 else -1
```

Key insight: if you can't reach station `i` from any starting point in `[0, i-1]`, then none of those starting points work. The next candidate start is `i+1`.

### Interval Scheduling

**Minimum intervals to cover a range**: sort by start, then always extend coverage as far as possible from the current frontier:

```python
def min_taps(n, ranges):
    intervals = sorted((i - r, i + r) for i, r in enumerate(ranges) if r > 0)
    reach = end = 0
    taps = 0
    i = 0
    while reach < n:
        while i < len(intervals) and intervals[i][0] <= reach:
            end = max(end, intervals[i][1])
            i += 1
        if end == reach:
            return -1  # can't extend
        taps += 1
        reach = end
    return taps
```

### Task Scheduling with Cooldowns

Given tasks and a cooldown period, find the minimum time to finish all tasks. Greedy: always schedule the most frequent remaining task:

```python
from collections import Counter
import heapq

def least_interval(tasks, n):
    counts = Counter(tasks)
    heap = [-c for c in counts.values()]
    heapq.heapify(heap)
    time = 0
    while heap:
        cycle = []
        for _ in range(n + 1):
            if heap:
                cycle.append(heapq.heappop(heap))
        for c in cycle:
            if c + 1 < 0:
                heapq.heappush(heap, c + 1)
        time += n + 1 if heap else len(cycle)
    return time
```

## Greedy vs DP

Many greedy problems can also be solved with DP. Greedy is faster but requires a proof. DP is safer but slower.

| | Greedy | DP |
|--|--------|-----|
| Time | Usually O(n log n) or O(n) | Usually O(n²) or O(n·k) |
| Correctness | Requires proof (exchange argument) | Correct by construction |
| When to use | Optimizing over a linear structure where local = global | When local choices depend on future state |

**Rule of thumb**: if you can sort the input and a single pass gives the answer, think greedy. If the optimal choice at step i depends on choices at step i+k, think DP.

## Exchange Argument (Proof Sketch)

To prove a greedy algorithm is correct:

1. Assume OPT is an optimal solution that differs from GREEDY
2. Find the first point where they differ
3. Show you can swap OPT's choice with GREEDY's choice without making OPT worse
4. Repeat until OPT = GREEDY

For interval scheduling: if OPT picks interval A (ends later) instead of interval B (ends earlier), swapping A for B can't remove any intervals from OPT — B ends no later than A, so anything compatible with A is also compatible with B.

## When Greedy Fails

Greedy fails when local choices don't compound to global optima. The classic counterexample is **coin change with arbitrary denominations**:

With coins `[1, 3, 4]` and target `6`:
- Greedy (largest first): 4 + 1 + 1 = 3 coins
- Optimal: 3 + 3 = 2 coins

Here a smaller coin (3) leads to a better global solution. DP is required.

## Summary

Greedy algorithms are the fastest approach when applicable, but they demand a correctness argument — not just intuition. The exchange argument is the standard proof technique. When in doubt, try greedy first on small examples, and if it fails, fall back to DP.
