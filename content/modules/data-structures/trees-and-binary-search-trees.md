---
title: "Trees and Binary Search Trees"
slug: "trees-and-binary-search-trees"
date: "2024-02-12"
description: "Tree traversals, BST properties, and the recursive thinking that makes tree problems click"
tags: ["dsa", "trees", "bst", "recursion", "fundamentals"]
featured: false
draft: false
module: "data-structures"
moduleOrder: 4
---

Trees are hierarchical data structures where every node has at most one parent. They appear constantly in interviews because they reward recursive thinking and have an elegant relationship between structure and algorithms.

## Terminology

```
        1          ← root
       / \
      2   3        ← internal nodes
     / \
    4   5          ← leaves
```

- **Root**: the top node (no parent)
- **Leaf**: a node with no children
- **Height**: longest path from root to a leaf
- **Depth**: distance from root to a node
- **Subtree**: a node and all its descendants

A **binary tree** has at most two children per node, conventionally called `left` and `right`.

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

## The Three Traversals

Traversal order defines which node you *process* relative to when you recurse:

```python
def inorder(root):   # left → root → right
    if not root: return
    inorder(root.left)
    print(root.val)
    inorder(root.right)

def preorder(root):  # root → left → right
    if not root: return
    print(root.val)
    preorder(root.left)
    preorder(root.right)

def postorder(root): # left → right → root
    if not root: return
    postorder(root.left)
    postorder(root.right)
    print(root.val)
```

**Mnemonic**: Pre/In/Post describes where the root falls relative to its children.

### Level-Order (BFS)

Use a queue to visit nodes level by level:

```python
from collections import deque

def level_order(root):
    if not root: return []
    result, queue = [], deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left: queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level)
    return result
```

## Recursive Tree Thinking

Most tree problems have the same shape: solve for left subtree, solve for right subtree, combine. The base case is always `None`.

**Example: maximum depth**

```python
def max_depth(root):
    if not root:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
```

**Example: check if two trees are identical**

```python
def is_same(p, q):
    if not p and not q: return True
    if not p or not q: return False
    return p.val == q.val and is_same(p.left, q.left) and is_same(p.right, q.right)
```

The pattern: handle None cases first, then recurse symmetrically.

## Binary Search Trees

A **BST** adds an ordering invariant: for every node, all values in its left subtree are smaller, and all values in its right subtree are larger.

This invariant makes **search O(log n)** on a balanced tree — at each step, you eliminate half the remaining nodes:

```python
def search(root, target):
    if not root or root.val == target:
        return root
    if target < root.val:
        return search(root.left, target)
    return search(root.right, target)
```

### In-Order Traversal of a BST

Because of the ordering invariant, an in-order traversal of a BST visits nodes in **sorted ascending order**. This is a key property used in many BST problems.

### Insert and Delete

```python
def insert(root, val):
    if not root:
        return TreeNode(val)
    if val < root.val:
        root.left = insert(root.left, val)
    else:
        root.right = insert(root.right, val)
    return root
```

Deletion is trickier for nodes with two children. The standard approach: replace the node's value with its **in-order successor** (leftmost node in the right subtree), then delete the successor:

```python
def delete(root, val):
    if not root: return None
    if val < root.val:
        root.left = delete(root.left, val)
    elif val > root.val:
        root.right = delete(root.right, val)
    else:
        if not root.left: return root.right
        if not root.right: return root.left
        # find in-order successor
        successor = root.right
        while successor.left:
            successor = successor.left
        root.val = successor.val
        root.right = delete(root.right, successor.val)
    return root
```

## Balanced Trees

A BST's O(log n) guarantee holds only if the tree stays **balanced** — height proportional to log n. An unbalanced BST degrades to a linked list with O(n) operations.

Self-balancing trees (AVL, Red-Black) automatically rebalance on insert/delete. In interviews, you won't implement them from scratch, but you should know:
- `TreeSet` / `TreeMap` in Java and `SortedList` in Python's `sortedcontainers` are backed by balanced BSTs
- They give O(log n) insert, delete, and search with sorted-order iteration

## Common Interview Problems

| Problem | Key Insight |
|---------|-------------|
| Validate BST | Track min/max bounds as you recurse |
| Lowest Common Ancestor | First node where paths to p and q diverge |
| Serialize/Deserialize | Pre-order with null markers round-trips a tree |
| Kth Smallest in BST | In-order traversal, count to k |
| Path Sum | DFS, subtract val at each node, check 0 at leaf |

### Validate BST

```python
def is_valid_bst(root, lo=float('-inf'), hi=float('inf')):
    if not root: return True
    if not (lo < root.val < hi): return False
    return (is_valid_bst(root.left, lo, root.val) and
            is_valid_bst(root.right, root.val, hi))
```

The bounds narrow at every recursive call — the BST invariant must hold for the *entire* subtree, not just the immediate children.

## Summary

Tree problems reward one skill above all others: the ability to decompose a problem into "what do I need from my left child, what do I need from my right child, and how do I combine them?" Build that reflex by writing every solution recursively first, then convert to iterative if needed. The traversal order — and whether DFS or BFS fits — usually falls out naturally from the problem statement.
