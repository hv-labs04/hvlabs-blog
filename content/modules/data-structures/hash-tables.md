---
title: "Hash Tables"
slug: "hash-tables"
date: "2024-02-15"
description: "How hash tables achieve O(1) average-case operations, collision handling, and why they're the most versatile tool in interview problem-solving"
tags: ["dsa", "hash-tables", "hash-maps", "fundamentals"]
featured: false
draft: false
module: "data-structures"
moduleOrder: 5
---

Hash tables are the most useful data structure in coding interviews. When in doubt, a hash map or hash set can often turn an O(n²) brute force into an O(n) solution. Understanding *why* they're O(1) — and when they're not — separates a practitioner from a memorizer.

## The Core Idea

A hash table maps keys to values by:

1. Running the key through a **hash function** to get an integer index
2. Storing the value in an array at that index

```
key "alice" → hash("alice") % capacity → index 3 → array[3] = value
```

A good hash function distributes keys uniformly across the array. A perfect one has no collisions; real ones always collide eventually.

## Handling Collisions

### Chaining

Each array bucket holds a linked list. Multiple keys that hash to the same index are stored in the same list:

```
array[3] → [("alice", 100) → ("charlie", 200)]
```

Lookup walks the chain to find the matching key. In the worst case (all keys collide), this is O(n). With a good hash function and a load factor below ~0.75, it's O(1) on average.

### Open Addressing (Linear Probing)

Instead of a linked list, the table stores the value directly in the array. On collision, probe forward until an empty slot is found:

```
insert("alice"):  hash → 3, slot 3 occupied → try 4 → empty, store at 4
```

Open addressing has better cache behavior (no pointer chasing) but requires careful handling of deletions and is sensitive to clustering.

## Load Factor and Rehashing

The **load factor** is `n / capacity` (number of entries divided by array size). As it approaches 1, collision chains grow and performance degrades.

Hash tables rehash — allocate a new, larger array and reinsert all entries — when the load factor exceeds a threshold (typically 0.75 for Java's `HashMap`). Like dynamic arrays, this is O(n) per rehash but O(1) amortized per insert.

## Python's dict and set

Python `dict` and `set` are hash tables. Both are O(1) average for insert, delete, and lookup:

```python
# dict: key → value
freq = {}
for ch in "hello":
    freq[ch] = freq.get(ch, 0) + 1
# {'h': 1, 'e': 1, 'l': 2, 'o': 1}

# set: O(1) membership test
seen = set()
for n in nums:
    if n in seen:
        return True
    seen.add(n)
```

`collections.Counter` is a dict subclass optimized for frequency counting. `collections.defaultdict` eliminates the `.get(key, default)` boilerplate.

## Interview Patterns

### Frequency Counting

Count occurrences of elements, then query the map:

```python
from collections import Counter

def is_anagram(s, t):
    return Counter(s) == Counter(t)
```

### "Seen Before" — Two Sum Pattern

The canonical O(n) two-sum: for each element, check if its complement is already in the map:

```python
def two_sum(nums, target):
    seen = {}  # value → index
    for i, n in enumerate(nums):
        complement = target - n
        if complement in seen:
            return [seen[complement], i]
        seen[n] = i
```

This works because you're trading O(n) space for O(n) time — the hash map stores the "history" so you don't need a second loop.

### Grouping with a Hash Key

Group anagrams by sorting each string to get a canonical key:

```python
from collections import defaultdict

def group_anagrams(strs):
    groups = defaultdict(list)
    for s in strs:
        key = tuple(sorted(s))
        groups[key].append(s)
    return list(groups.values())
```

Any transformation that maps equivalent items to the same key works here.

### Sliding Window + Hash Map

Track character frequencies in a window to find substrings with certain properties:

```python
def length_of_longest_substring(s):
    last_seen = {}
    start = best = 0
    for i, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= start:
            start = last_seen[ch] + 1
        last_seen[ch] = i
        best = max(best, i - start + 1)
    return best
```

## When O(1) Breaks Down

Hash tables are not always O(1):

- **Worst case is O(n)** — pathological inputs or poor hash functions cause all keys to collide
- **Unhashable types** — mutable objects (lists, dicts) can't be used as keys in Python; use tuples
- **Memory overhead** — a hash table with a 0.75 load factor uses ~33% more memory than the data itself
- **No ordering** — standard hash tables don't preserve insertion order (Python 3.7+ dicts do, but this is an implementation detail, not a guarantee across languages)

For ordered operations (floor/ceiling queries, sorted iteration), a balanced BST (`TreeMap` in Java, `SortedDict` from `sortedcontainers` in Python) is the right choice at the cost of O(log n) per operation.

## Hash Set vs Hash Map

A **set** answers "have I seen this before?" A **map** answers "what value is associated with this key?" Use the simpler one:

```python
# set: existence check only
visited = set()

# map: existence + associated value
dist = {}  # node → distance
```

## Summary

Hash tables collapse many O(n) or O(n²) problems to O(n) by letting you trade memory for time. The interview skill is recognizing *when* a hash map turns a nested loop into a single pass: "for each element, I need to know if some related element exists." That phrase is almost always solved with a hash map.
