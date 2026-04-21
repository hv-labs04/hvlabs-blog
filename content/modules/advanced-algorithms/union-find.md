---
title: "Union-Find (Disjoint Set Union)"
slug: "union-find"
date: "2024-04-12"
description: "The near-O(1) data structure for dynamic connectivity — how path compression and union by rank make it almost free"
tags: ["dsa", "union-find", "dsu", "graphs", "advanced"]
featured: false
draft: false
module: "advanced-algorithms"
moduleOrder: 4
---

Union-Find (also called Disjoint Set Union or DSU) answers a single question extremely efficiently: **are two elements in the same connected component?** With path compression and union by rank, both `find` and `union` run in near-O(1) — technically O(α(n)) where α is the inverse Ackermann function, which is ≤ 4 for any practical n.

## The Core Operations

- **find(x)**: return the representative (root) of x's component
- **union(x, y)**: merge the components containing x and y
- **connected(x, y)**: return `find(x) == find(y)`

## Implementation

```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))  # initially, each node is its own root
        self.rank = [0] * n           # tree height (upper bound)
        self.count = n                # number of connected components

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return False  # already connected
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx          # attach smaller tree under larger
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1
        self.count -= 1
        return True

    def connected(self, x, y):
        return self.find(x) == self.find(y)
```

### Path Compression

Without optimization, `find` walks up the tree — O(n) worst case for a degenerate chain. **Path compression** flattens the tree during `find`: every node on the path to the root is updated to point directly to the root.

```
Before: 1 → 2 → 3 → 4 (root)
After find(1): 1 → 4, 2 → 4, 3 → 4 (all point to root)
```

### Union by Rank

Without rank tracking, unions could create tall trees. By always attaching the shorter tree under the taller one (comparing ranks), the tree height stays O(log n).

Together, path compression + union by rank achieve the near-O(1) amortized bound.

## Number of Connected Components

The most direct application: given n nodes and a list of edges, find the number of connected components.

```python
def count_components(n, edges):
    uf = UnionFind(n)
    for u, v in edges:
        uf.union(u, v)
    return uf.count
```

## Number of Islands (Union-Find variant)

The classic grid problem, solved with Union-Find instead of DFS:

```python
def num_islands(grid):
    if not grid: return 0
    rows, cols = len(grid), len(grid[0])
    uf = UnionFind(rows * cols)
    water = 0

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '0':
                water += 1
            else:
                for dr, dc in [(0,1),(1,0)]:
                    nr, nc = r+dr, c+dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == '1':
                        uf.union(r*cols+c, nr*cols+nc)

    return uf.count - water
```

Map 2D coordinates to 1D: `r * cols + c`.

## Kruskal's Minimum Spanning Tree

Union-Find is the backbone of Kruskal's MST algorithm: sort edges by weight, greedily add edges that don't form a cycle.

```python
def min_spanning_tree(n, edges):
    """edges: [(weight, u, v)]"""
    edges.sort()
    uf = UnionFind(n)
    mst_weight = 0
    mst_edges = []
    for weight, u, v in edges:
        if uf.union(u, v):  # union returns True if they were in different components
            mst_weight += weight
            mst_edges.append((u, v))
            if len(mst_edges) == n - 1:
                break
    return mst_weight, mst_edges
```

Time: O(E log E) dominated by sorting. The Union-Find operations are near-O(1) each.

## Detecting Cycles

A cycle exists if you try to union two nodes that are already in the same component:

```python
def has_cycle(n, edges):
    uf = UnionFind(n)
    for u, v in edges:
        if not uf.union(u, v):  # already connected → cycle
            return True
    return False
```

## Online Connectivity Queries

Union-Find handles **dynamic graphs** where edges are added over time. Each `union` is irreversible — if you need to also *remove* edges, you need Link-Cut Trees (much harder). For add-only scenarios, Union-Find is optimal.

## Accounts Merge

Group accounts by shared email. Each email and account is a node; union accounts that share an email:

```python
def accounts_merge(accounts):
    parent = {}
    def find(x):
        parent.setdefault(x, x)
        if parent[x] != x:
            parent[x] = find(parent[x])
        return parent[x]
    def union(x, y):
        parent[find(x)] = find(y)

    email_to_name = {}
    for account in accounts:
        name = account[0]
        for email in account[1:]:
            email_to_name[email] = name
            union(account[1], email)  # union all emails to the first

    from collections import defaultdict
    groups = defaultdict(list)
    for email in email_to_name:
        groups[find(email)].append(email)

    return [[email_to_name[root]] + sorted(emails)
            for root, emails in groups.items()]
```

## When to Use Union-Find vs BFS/DFS

| | Union-Find | BFS/DFS |
|--|------------|---------|
| Build once, query many times | ✓ O(α) per query | ✗ O(V+E) per query |
| Dynamic edges (add only) | ✓ online | ✗ must re-run |
| Shortest path | ✗ | ✓ |
| Detect cycle | ✓ | ✓ |
| MST (Kruskal) | ✓ natural fit | ✗ |
| Reachability on static graph | Either | Either |

## Summary

Union-Find is a narrow but deep data structure. It does one thing — dynamic connectivity — almost for free. The moment a problem involves grouping, merging sets, or checking if two elements are connected in a changing graph, reach for Union-Find. The implementation is always the same; the skill is recognizing the problem structure.
