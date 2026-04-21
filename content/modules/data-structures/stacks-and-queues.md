---
title: "Stacks and Queues"
slug: "stacks-and-queues"
date: "2024-02-08"
description: "LIFO vs FIFO — the abstract data types, their implementations, and the surprising range of problems they unlock"
tags: ["dsa", "stacks", "queues", "fundamentals"]
featured: false
draft: false
module: "data-structures"
moduleOrder: 3
---

Stacks and queues are abstract data types, not data structures. The distinction matters: the *interface* is LIFO or FIFO, but the *implementation* can be an array or a linked list. Understanding both layers helps you pick the right tool.

## The Stack

A stack follows **Last In, First Out (LIFO)**. The last element pushed is the first one popped.

```
push(1) → [1]
push(2) → [1, 2]
push(3) → [1, 2, 3]
pop()   → 3, stack: [1, 2]
peek()  → 2, stack: [1, 2]
```

### Implementation

In Python, a list works perfectly as a stack — `append` for push and `pop` for pop, both O(1):

```python
stack = []
stack.append(1)  # push
stack.append(2)
top = stack[-1]  # peek
val = stack.pop()  # pop
```

### Classic Stack Problems

**Balanced parentheses** — push opening brackets, pop and match on closing:

```python
def is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in '([{':
            stack.append(ch)
        elif not stack or stack[-1] != pairs[ch]:
            return False
        else:
            stack.pop()
    return not stack
```

**Monotonic stack** — maintain a stack of elements in increasing or decreasing order to find the next greater/smaller element in O(n):

```python
def next_greater(nums):
    result = [-1] * len(nums)
    stack = []  # indices of elements waiting for their next greater
    for i, n in enumerate(nums):
        while stack and nums[stack[-1]] < n:
            result[stack.pop()] = n
        stack.append(i)
    return result
```

The monotonic stack pattern appears in problems about histograms, stock spans, and temperature forecasts.

**Expression evaluation** — use two stacks (operands and operators) to evaluate infix expressions without building an AST.

## The Queue

A queue follows **First In, First Out (FIFO)**. Elements are added at the back (enqueue) and removed from the front (dequeue).

### Implementation

Python's `collections.deque` is the right choice — O(1) append and popleft:

```python
from collections import deque

queue = deque()
queue.append(1)     # enqueue
queue.append(2)
front = queue[0]    # peek
val = queue.popleft()  # dequeue — O(1)
```

Avoid using a plain list as a queue. `list.pop(0)` is O(n) because every remaining element shifts left.

### BFS and the Queue

The canonical use of a queue is **Breadth-First Search**. BFS visits nodes level by level, and the queue ensures that earlier-discovered nodes are processed first:

```python
from collections import deque

def bfs(graph, start):
    visited = {start}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
```

BFS finds the shortest path in an unweighted graph — a fact that comes directly from the FIFO property.

## The Priority Queue (Heap)

When "queue" means "always dequeue the highest-priority element," you want a **priority queue**, implemented as a heap:

```python
import heapq

min_heap = []
heapq.heappush(min_heap, 3)
heapq.heappush(min_heap, 1)
heapq.heappush(min_heap, 2)
print(heapq.heappop(min_heap))  # 1 — minimum first
```

Python's `heapq` is a min-heap. For a max-heap, negate the values.

Priority queues power Dijkstra's algorithm, scheduling simulations, and the "k largest elements" family of problems.

## Implementing a Queue with Two Stacks

A classic interview question: implement a queue using only stacks. The trick is lazy transfer:

```python
class MyQueue:
    def __init__(self):
        self.inbox = []   # for enqueue
        self.outbox = []  # for dequeue

    def push(self, x):
        self.inbox.append(x)

    def pop(self):
        self._transfer()
        return self.outbox.pop()

    def peek(self):
        self._transfer()
        return self.outbox[-1]

    def _transfer(self):
        if not self.outbox:
            while self.inbox:
                self.outbox.append(self.inbox.pop())
```

Each element is moved at most once, so the amortized cost per operation is O(1).

## Stack vs Queue Decision Guide

| Use a stack when... | Use a queue when... |
|---------------------|---------------------|
| Order of processing is reverse of insertion | Order must match insertion (fairness) |
| Backtracking / undo | BFS / level-order traversal |
| Parsing nested structures | Job scheduling |
| DFS iteratively | Sliding window minimum (deque) |

## Monotonic Deque

A deque (double-ended queue) can function as a monotonic stack from both ends. The classic use is the **sliding window maximum**: maintain indices of elements in decreasing order, evicting those that fall outside the window:

```python
from collections import deque

def sliding_window_max(nums, k):
    dq = deque()  # indices, nums[dq[0]] is always the max
    result = []
    for i, n in enumerate(nums):
        while dq and nums[dq[-1]] < n:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            result.append(nums[dq[0]])
    return result
```

This runs in O(n) — each element enters and leaves the deque at most once.

## Summary

Stack and queue problems are really about recognizing the access pattern a problem requires: last-in-first-out, first-in-first-out, or priority-driven. Once you identify the pattern, the implementation is mechanical. The deeper skill is noticing that a monotonic stack or deque can collapse an O(n²) brute force into O(n) by maintaining a useful invariant as you iterate.
