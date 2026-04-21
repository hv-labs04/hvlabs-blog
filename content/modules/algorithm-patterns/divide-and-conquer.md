---
title: "Divide and Conquer"
slug: "divide-and-conquer"
date: "2024-03-15"
description: "Split, solve, combine — the algorithmic paradigm behind merge sort, quick sort, and a surprisingly wide range of problems"
tags: ["dsa", "divide-and-conquer", "recursion", "sorting", "algorithms"]
featured: false
draft: false
module: "algorithm-patterns"
moduleOrder: 5
---

Divide and conquer is a design paradigm: split a problem into independent subproblems, solve each recursively, then combine the results. The independence of subproblems is what separates it from DP (which handles overlapping subproblems).

## The Pattern

```
solve(problem):
    if problem is small enough:
        return base_case(problem)
    left, right = split(problem)
    left_result = solve(left)
    right_result = solve(right)
    return combine(left_result, right_result)
```

The recurrence `T(n) = aT(n/b) + O(n^d)` describes the running time. The Master Theorem gives the solution:
- `d > log_b(a)` → O(n^d)
- `d = log_b(a)` → O(n^d · log n)
- `d < log_b(a)` → O(n^log_b(a))

## Merge Sort

The canonical divide-and-conquer algorithm. Split the array in half, sort each half, merge:

```python
def merge_sort(nums):
    if len(nums) <= 1:
        return nums
    mid = len(nums) // 2
    left = merge_sort(nums[:mid])
    right = merge_sort(nums[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result
```

Time: O(n log n). The `log n` levels times O(n) merge work per level.  
Space: O(n) auxiliary — the merge step needs a temporary array.

### Merge Sort for Counting Inversions

An inversion is a pair (i, j) where i < j but nums[i] > nums[j]. Counting inversions is a classic extension of merge sort: during the merge step, whenever you pick from the right half, you know nums[right] < nums[left…end_of_left], so count those inversions:

```python
def count_inversions(nums):
    if len(nums) <= 1:
        return nums, 0
    mid = len(nums) // 2
    left, left_inv = count_inversions(nums[:mid])
    right, right_inv = count_inversions(nums[mid:])
    merged, split_inv = merge_count(left, right)
    return merged, left_inv + right_inv + split_inv

def merge_count(left, right):
    result, inversions = [], 0
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
            inversions += len(left) - i  # all remaining left elements > right[j]
    result.extend(left[i:]); result.extend(right[j:])
    return result, inversions
```

## Quick Sort

Split by pivot, sort each side. Unlike merge sort, the split is not at the midpoint — it places all elements smaller than the pivot on the left and larger on the right:

```python
def quick_sort(nums, lo, hi):
    if lo >= hi: return
    pivot_idx = partition(nums, lo, hi)
    quick_sort(nums, lo, pivot_idx - 1)
    quick_sort(nums, pivot_idx + 1, hi)

def partition(nums, lo, hi):
    pivot = nums[hi]
    i = lo - 1
    for j in range(lo, hi):
        if nums[j] <= pivot:
            i += 1
            nums[i], nums[j] = nums[j], nums[i]
    nums[i+1], nums[hi] = nums[hi], nums[i+1]
    return i + 1
```

Average time: O(n log n). Worst case: O(n²) on sorted input with a naive pivot. Mitigated by random pivot selection.

**Quick select** (find the k-th smallest element) uses the same partition logic but only recurses into one half — O(n) average:

```python
def kth_smallest(nums, k):
    def select(lo, hi):
        pivot_idx = partition(nums, lo, hi)
        if pivot_idx == k - 1:
            return nums[pivot_idx]
        elif pivot_idx > k - 1:
            return select(lo, pivot_idx - 1)
        else:
            return select(pivot_idx + 1, hi)
    return select(0, len(nums) - 1)
```

## Binary Search as Divide and Conquer

Binary search is divide and conquer where you discard one half entirely:

```
T(n) = T(n/2) + O(1) → O(log n)
```

The "combine" step is trivial — you just return whichever half had the answer.

## Closest Pair of Points

Classic geometry problem. Brute force is O(n²); divide and conquer achieves O(n log n):

1. Sort by x-coordinate
2. Split into left and right halves
3. Find closest pair in each half recursively — call it `d`
4. Check pairs that straddle the midline within distance `d`

The key insight: the strip of width `2d` around the midline contains at most 8 points that need to be checked per point (geometric argument), making step 4 O(n) rather than O(n²).

## Strassen's Matrix Multiplication

Standard matrix multiply is O(n³). Strassen's algorithm is O(n^log₂7) ≈ O(n^2.807) by reducing 8 recursive multiplications to 7 using algebraic identities. In practice, it's rarely used due to poor cache behavior and numerical issues, but it demonstrates that clever divide-and-conquer can improve asymptotic complexity.

## When to Use Divide and Conquer

- **Sorting** — merge sort, quick sort
- **Selection** — quick select for k-th element
- **Counting problems** — inversions, range queries
- **Geometric problems** — closest pair, convex hull
- **Tree problems** — most tree recursion is implicitly divide and conquer

## Summary

Divide and conquer shines when problems decompose into independent halves. The analysis is uniform — compute T(n) = aT(n/b) + f(n) and apply the Master Theorem. In interviews, merge sort and quick select are the most commonly tested variants. The deeper skill is recognizing when an O(n²) brute force can be sped up by exploiting a sorted or divided structure.
