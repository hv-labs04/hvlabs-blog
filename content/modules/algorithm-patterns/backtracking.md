---
title: "Backtracking"
slug: "backtracking"
date: "2024-03-08"
description: "Systematic exhaustive search — how backtracking prunes the search tree and the template that fits almost every backtracking problem"
tags: ["dsa", "backtracking", "recursion", "algorithms", "patterns"]
featured: false
draft: false
module: "algorithm-patterns"
moduleOrder: 3
---

Backtracking is structured brute force. You explore all possibilities but prune branches the moment you know they can't lead to a valid answer. The result is exponential in the worst case but often much faster in practice.

## The Template

Nearly every backtracking problem fits this skeleton:

```python
def backtrack(state, choices):
    if is_solution(state):
        results.append(copy(state))
        return
    for choice in choices:
        if is_valid(state, choice):
            make_choice(state, choice)
            backtrack(state, next_choices(state, choice))
            undo_choice(state, choice)  # ← the "back" in backtracking
```

The **undo step** is what makes this backtracking instead of plain recursion. After exploring a branch, you restore state so the next branch starts from the same point.

## Subsets

Generate all subsets of a list. At each position, you either include the element or skip it:

```python
def subsets(nums):
    result = []
    def backtrack(start, current):
        result.append(current[:])  # snapshot of current subset
        for i in range(start, len(nums)):
            current.append(nums[i])
            backtrack(i + 1, current)
            current.pop()  # undo
    backtrack(0, [])
    return result
```

For `[1, 2, 3]`, this generates 2³ = 8 subsets. The recursion tree has 2ⁿ leaves — unavoidable for exhaustive enumeration.

## Permutations

Generate all orderings. Unlike subsets, every element must appear exactly once:

```python
def permutations(nums):
    result = []
    def backtrack(current, remaining):
        if not remaining:
            result.append(current[:])
            return
        for i, num in enumerate(remaining):
            current.append(num)
            backtrack(current, remaining[:i] + remaining[i+1:])
            current.pop()
    backtrack([], nums)
    return result
```

Or more efficiently with in-place swapping:

```python
def permutations(nums):
    result = []
    def backtrack(start):
        if start == len(nums):
            result.append(nums[:])
            return
        for i in range(start, len(nums)):
            nums[start], nums[i] = nums[i], nums[start]
            backtrack(start + 1)
            nums[start], nums[i] = nums[i], nums[start]  # undo swap
    backtrack(0)
    return result
```

## Combinations

Choose k elements from n without repeats:

```python
def combinations(n, k):
    result = []
    def backtrack(start, current):
        if len(current) == k:
            result.append(current[:])
            return
        # Pruning: stop if remaining elements can't fill k slots
        for i in range(start, n - (k - len(current)) + 2):
            current.append(i)
            backtrack(i + 1, current)
            current.pop()
    backtrack(1, [])
    return result
```

The pruning condition `n - (k - len(current)) + 2` prevents starting a branch that can't possibly reach k elements — a small but significant optimization.

## Handling Duplicates

When the input contains duplicates, sort first and skip elements that match the previous choice at the same recursive level:

```python
def subsets_with_dups(nums):
    nums.sort()
    result = []
    def backtrack(start, current):
        result.append(current[:])
        for i in range(start, len(nums)):
            if i > start and nums[i] == nums[i-1]:  # skip dup at this level
                continue
            current.append(nums[i])
            backtrack(i + 1, current)
            current.pop()
    backtrack(0, [])
    return result
```

The check `i > start` is critical — it allows the same value to appear across different recursive levels (different positions in the subset), while preventing the same value from being chosen twice at the same level.

## N-Queens

Constraint satisfaction: place n queens on an n×n board with no two queens attacking each other.

```python
def solve_n_queens(n):
    result = []
    cols = set()
    diag1 = set()  # row - col (constant along \ diagonal)
    diag2 = set()  # row + col (constant along / diagonal)

    def backtrack(row, board):
        if row == n:
            result.append(["".join(r) for r in board])
            return
        for col in range(n):
            if col in cols or (row-col) in diag1 or (row+col) in diag2:
                continue  # pruning: skip invalid positions
            cols.add(col); diag1.add(row-col); diag2.add(row+col)
            board[row][col] = 'Q'
            backtrack(row + 1, board)
            cols.remove(col); diag1.remove(row-col); diag2.remove(row+col)
            board[row][col] = '.'

    board = [['.']*n for _ in range(n)]
    backtrack(0, board)
    return result
```

The constraint sets make checking validity O(1) instead of O(n).

## Pruning Strategy

Good pruning is the difference between a solution that barely passes and one that runs fast. Common pruning techniques:

1. **Early termination**: if the current state already violates a constraint, don't recurse
2. **Feasibility check**: if you can't possibly reach a solution from here (e.g., not enough elements remain), stop
3. **Sorted input + skip duplicates**: sort once, then skip identical choices at the same level

## Backtracking vs DP

Both explore subproblems, but differently:
- **Backtracking** builds a solution step by step and undoes bad choices. Best for *enumeration* (find all solutions).
- **DP** stores answers to subproblems to avoid recomputation. Best for *optimization* (find the best solution).

Many problems can be solved with either — e.g., subset sum can be backtracking (enumerate subsets) or DP (count ways). DP is usually faster; backtracking is usually simpler to implement.

## Summary

Backtracking is the "try everything, undo bad choices" paradigm. The template is always the same: make a choice, recurse, undo the choice. The art is in the pruning — identifying constraints that let you cut branches early. Sort the input when dealing with duplicates, and track constraint sets (like the queens' diagonals) to make validity checks O(1).
