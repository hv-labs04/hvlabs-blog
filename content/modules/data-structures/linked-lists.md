---
title: "Linked Lists"
slug: "linked-lists"
date: "2024-02-05"
description: "Singly and doubly linked lists — how they work, where they beat arrays, and the pointer manipulation patterns every interview tests"
tags: ["dsa", "linked-lists", "pointers", "fundamentals"]
featured: false
draft: false
module: "data-structures"
moduleOrder: 2
---

Linked lists are a rite of passage in DSA interviews. They're rarely the right choice in production code, but they test your ability to reason about pointers and handle edge cases — skills that transfer everywhere.

## Structure

A linked list is a chain of nodes. Each node holds a value and a pointer to the next node:

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
```

The list is identified only by its **head** pointer. There is no index arithmetic — to reach the k-th element you must walk k steps from the head.

### Singly vs Doubly Linked

A **singly linked list** has one pointer per node (`next`). A **doubly linked list** adds a `prev` pointer, enabling O(1) backward traversal and making deletion O(1) when you already have the node reference.

Python's `collections.deque` and many LRU cache implementations use a doubly linked list internally.

## Complexity Comparison

| Operation | Array | Linked List |
|-----------|-------|-------------|
| Access by index | O(1) | O(n) |
| Insert at head | O(n) | O(1) |
| Insert at tail | O(1) amortized | O(n) singly / O(1) doubly |
| Insert in middle (with pointer) | O(n) | O(1) |
| Delete (with pointer) | O(n) | O(1) doubly / O(n) singly |
| Search | O(n) | O(n) |

The key insight: a linked list wins at **insert/delete when you already have a reference to the node**. It loses at **random access** because there's no index.

## Essential Patterns

### The Dummy Head

Many problems become cleaner with a sentinel (dummy) node at the front. It eliminates special-casing for an empty list or operations at the head:

```python
def remove_elements(head, val):
    dummy = ListNode(0, head)
    cur = dummy
    while cur.next:
        if cur.next.val == val:
            cur.next = cur.next.next
        else:
            cur = cur.next
    return dummy.next
```

### Fast and Slow Pointers (Floyd's Algorithm)

Use two pointers moving at different speeds to detect cycles or find the middle node without knowing the list length:

```python
def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False

def find_middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow  # slow is at the middle
```

When `fast` reaches the end, `slow` is at ⌊n/2⌋ — exactly the middle.

### Reversing a Linked List

Reversing in-place is a building block for many harder problems. The key is tracking three pointers simultaneously:

```python
def reverse(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev  # new head
```

Walk through this with a 3-node list until the pointer movement is automatic.

### Merging Two Sorted Lists

Classic divide-and-conquer building block. Use a dummy head to avoid branching on the first comparison:

```python
def merge_two_lists(l1, l2):
    dummy = ListNode()
    cur = dummy
    while l1 and l2:
        if l1.val <= l2.val:
            cur.next, l1 = l1, l1.next
        else:
            cur.next, l2 = l2, l2.next
        cur = cur.next
    cur.next = l1 or l2
    return dummy.next
```

### Finding the k-th Node from the End

Without knowing the length, use two pointers separated by k steps:

```python
def kth_from_end(head, k):
    fast = slow = head
    for _ in range(k):
        fast = fast.next
    while fast:
        slow = slow.next
        fast = fast.next
    return slow
```

When `fast` falls off the end, `slow` is exactly k steps behind — at the k-th node from the end.

## Common Interview Mistakes

1. **Forgetting to handle `None`** — always check `cur` and `cur.next` before dereferencing
2. **Losing the rest of the list** — before redirecting a `next` pointer, save the node it was pointing to
3. **Off-by-one in two-pointer separation** — draw the list, count by hand
4. **Not returning the new head** — after reversal, the original head is now the tail

## When Linked Lists Are Used in Production

You'll rarely implement a raw linked list in application code, but they underpin:
- **Queues and deques** — O(1) enqueue and dequeue at both ends
- **LRU caches** — doubly linked list + hash map gives O(1) get/put
- **Undo history** — each state is a node; undo walks back
- **File system inodes** — block lists

## Summary

The linked list interview is really a test of pointer discipline. Master the dummy-head pattern, the fast/slow pointer trick, and in-place reversal. Those three patterns cover the majority of linked list problems you'll encounter.
