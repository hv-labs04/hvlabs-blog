---
title: "Binary Search"
slug: "binary-search"
date: "2024-03-01"
description: "Binary search beyond sorted arrays — how to apply it to any monotonic function and why the boundary conditions trip people up"
tags: ["dsa", "binary-search", "algorithms", "patterns"]
featured: false
draft: false
module: "algorithm-patterns"
moduleOrder: 1
---

Binary search is one of the most misunderstood patterns in interviews. People memorize the sorted-array version and miss the broader principle: binary search works on any **monotonic predicate** — any yes/no question where the answer transitions from "no" to "yes" exactly once.

## The Core Template

```python
def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = left + (right - left) // 2  # avoids overflow
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
```

The invariant: `target` is always within `[left, right]` if it exists.

## Why `mid = left + (right - left) // 2`

In languages with fixed-width integers (C++, Java), `(left + right) // 2` can overflow when both values are large. The subtraction form avoids this. Python has arbitrary-precision integers so it doesn't matter in practice, but it's a good habit.

## Finding the Boundary (Lower/Upper Bound)

Most interview problems don't ask for *an* occurrence — they ask for the *first* or *last* occurrence, or "the leftmost position where condition is true." This is the **boundary binary search**:

```python
def lower_bound(nums, target):
    """First index where nums[i] >= target"""
    left, right = 0, len(nums)
    while left < right:
        mid = left + (right - left) // 2
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid
    return left

def upper_bound(nums, target):
    """First index where nums[i] > target"""
    left, right = 0, len(nums)
    while left < right:
        mid = left + (right - left) // 2
        if nums[mid] <= target:
            left = mid + 1
        else:
            right = mid
    return left
```

Note: `right = len(nums)` (not `len(nums) - 1`) because the answer might be "past the end."

## Binary Search on the Answer Space

This is the generalization that makes binary search powerful. Instead of searching an array, you binary search over possible *answers* and ask "is this answer feasible?"

**Example: "Find the minimum capacity such that you can ship all packages in D days"**

```python
def ship_within_days(weights, days):
    def can_ship(capacity):
        current, trips = 0, 1
        for w in weights:
            if current + w > capacity:
                trips += 1
                current = 0
            current += w
        return trips <= days

    left, right = max(weights), sum(weights)
    while left < right:
        mid = left + (right - left) // 2
        if can_ship(mid):
            right = mid
        else:
            left = mid + 1
    return left
```

The search space is `[max(weights), sum(weights)]` — the minimum possible capacity and the maximum. The predicate `can_ship(mid)` is monotonic: if capacity `c` works, all capacities `> c` also work. So we search for the leftmost `c` that works.

## The Monotonic Predicate Template

Whenever you see "find the minimum X such that P(X) is true" or "find the maximum X such that P(X) is false," binary search on X:

```python
def find_min_valid(lo, hi, predicate):
    """Find the smallest value in [lo, hi] where predicate is True"""
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if predicate(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

Examples of problems that fit this template:
- Koko eating bananas (minimum eating speed)
- Minimum number of days to make bouquets
- Capacity to ship packages
- Split array largest sum
- Magnetic force between balls

## Binary Search on Rotated Arrays

A sorted array rotated at some pivot still has a "mostly sorted" structure you can exploit:

```python
def search_rotated(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if nums[mid] == target:
            return mid
        if nums[left] <= nums[mid]:  # left half is sorted
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:  # right half is sorted
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1
    return -1
```

Key insight: one of the two halves is always sorted. Check which half is sorted, then determine if the target falls in it.

## Common Pitfalls

**Off-by-one errors** come from three choices you must make consciously:
1. `right = len - 1` vs `right = len` (closed vs half-open interval)
2. `while left <= right` vs `while left < right`
3. `left = mid + 1` vs `left = mid`

These choices must be consistent. A reliable rule: use `left < right` with `right = len` for boundary problems; use `left <= right` with `right = len - 1` for exact-match problems.

**Infinite loop** — if you ever have `left = mid` without `right = mid - 1` on the other branch, you might loop forever. Always ensure the search space strictly shrinks.

## Summary

Binary search is not about sorted arrays — it's about monotonic functions. The moment you can ask "is value X sufficient?" and the answer is monotone (once true, stays true), you can binary search on X. The implementation is mechanical once you identify the search space bounds and the predicate.
