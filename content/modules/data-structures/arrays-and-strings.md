---
title: "Arrays and Strings"
slug: "arrays-and-strings"
date: "2024-02-01"
description: "The foundation of every interview — how arrays and strings work in memory, common operations, and when to reach for each"
tags: ["dsa", "arrays", "strings", "fundamentals"]
featured: false
draft: false
module: "data-structures"
moduleOrder: 1
---

Arrays and strings are the most common data structures you'll encounter in coding interviews. Before reaching for a fancier structure, it's worth deeply understanding the guarantees and trade-offs they offer.

## How Arrays Work in Memory

An array is a contiguous block of memory where every element is the same size. This single constraint gives arrays two powerful properties:

- **O(1) random access** — any index can be reached by computing `base_address + index * element_size`
- **Cache friendliness** — sequential access patterns hit the CPU cache repeatedly, making traversals fast in practice

The cost is rigidity: you pay for the whole block upfront, and resizing means allocating a new block and copying everything.

### Static vs Dynamic Arrays

Languages like C expose raw static arrays. Most modern languages (Python lists, Java `ArrayList`, C++ `std::vector`) use a **dynamic array** under the hood: start with a fixed-size buffer, and when it fills up, allocate a buffer twice as large and move the elements.

This "double on overflow" strategy amortizes the cost of resizing. Any single insert might trigger an O(n) copy, but across *n* inserts the total work is O(n), giving **amortized O(1) append**.

```python
# Python's list is a dynamic array
nums = []
for i in range(5):
    nums.append(i)  # amortized O(1)
```

## Common Operations and Complexity

| Operation | Array | Notes |
|-----------|-------|-------|
| Access by index | O(1) | |
| Search (unsorted) | O(n) | Linear scan |
| Search (sorted) | O(log n) | Binary search |
| Insert at end | O(1) amortized | Dynamic arrays |
| Insert at middle | O(n) | Must shift elements |
| Delete from middle | O(n) | Must shift elements |

## Strings as Special Arrays

Strings are arrays of characters with one extra wrinkle: **immutability** in most languages (Python, Java, Go). When you write:

```python
s = "hello"
s = s + " world"
```

Python does not mutate `s` in place. It allocates a new string. This makes naive string concatenation in a loop O(n²):

```python
# Bad — O(n²) due to repeated allocation
result = ""
for word in words:
    result += word

# Good — O(n) using a list as a buffer
result = "".join(words)
```

The fix: accumulate into a list and join at the end.

## Key Interview Patterns

### Two Pointers

When a problem involves searching pairs or partitioning a sorted array, two pointers avoids the O(n²) brute force:

```python
def two_sum_sorted(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target:
            return [left, right]
        elif s < target:
            left += 1
        else:
            right -= 1
    return []
```

### Prefix Sums

When a problem asks for the sum of any sub-array, precompute a prefix sum array to answer each query in O(1):

```python
def build_prefix(nums):
    prefix = [0] * (len(nums) + 1)
    for i, n in enumerate(nums):
        prefix[i + 1] = prefix[i] + n
    return prefix

# Sum from index l to r (inclusive)
def range_sum(prefix, l, r):
    return prefix[r + 1] - prefix[l]
```

### Sliding Window

For contiguous sub-array problems with a constraint (max sum, longest with no repeat), a sliding window maintains state as it expands and shrinks:

```python
def max_sum_subarray(nums, k):
    window_sum = sum(nums[:k])
    best = window_sum
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]
        best = max(best, window_sum)
    return best
```

## When to Use an Array

Use an array when:
- You know the size upfront or need random access by index
- You're iterating sequentially and want cache efficiency
- Memory locality matters (e.g., implementing a buffer or matrix)

Reach for something else when:
- You need O(1) insert/delete in the middle → linked list
- You need O(1) lookup by key → hash table
- You need ordered traversal with fast insert → balanced BST

## Summary

Arrays are simple but their in-memory layout gives them asymptotic and practical advantages that make them the go-to default. The patterns — two pointers, prefix sums, sliding window — all exist because the O(1) index access makes them viable. Knowing when you can apply these patterns is more valuable than memorizing the array API.
