---
title: "Graphs"
slug: "graphs"
date: "2024-02-19"
description: "Graph representations, BFS and DFS traversals, and the problem patterns that graphs unlock"
tags: ["dsa", "graphs", "bfs", "dfs", "fundamentals"]
featured: false
draft: false
module: "data-structures"
moduleOrder: 6
---

Graphs are the most general data structure in DSA — trees are graphs, linked lists are graphs, and many real-world problems (routing, social networks, scheduling) reduce to graph problems. The challenge is recognizing when something *is* a graph problem.

## What Is a Graph?

A graph is a set of **nodes** (vertices) connected by **edges**. Edges can be:
- **Directed** (one-way) or **undirected** (two-way)
- **Weighted** (with a cost) or **unweighted**

A tree is an undirected, connected, acyclic graph with n−1 edges for n nodes.

## Representations

### Adjacency List

Store a mapping from each node to its list of neighbors. This is the most common representation:

```python
# Undirected graph with 4 nodes
graph = {
    0: [1, 2],
    1: [0, 3],
    2: [0],
    3: [1],
}
```

Space: O(V + E). Edge lookup: O(degree of node). Best for sparse graphs (most real-world graphs).

### Adjacency Matrix

A V×V boolean matrix where `matrix[i][j] = True` means an edge exists from i to j:

```python
# Same graph as matrix
matrix = [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 0],
    [0, 1, 0, 0],
]
```

Space: O(V²). Edge lookup: O(1). Best when the graph is dense or you need fast edge existence checks.

### Implicit Graph

Many interview problems have no explicit adjacency list — the graph is defined by rules. Sliding puzzle, word ladder, and grid problems all have implicit graphs where neighbors are computed on the fly.

## Depth-First Search (DFS)

DFS explores as far as possible along each branch before backtracking:

```python
def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    visited.add(start)
    for neighbor in graph[start]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
    return visited
```

**Iterative DFS** uses an explicit stack (the recursive version uses the call stack implicitly):

```python
def dfs_iterative(graph, start):
    visited = set()
    stack = [start]
    while stack:
        node = stack.pop()
        if node in visited:
            continue
        visited.add(node)
        stack.extend(graph[node])
    return visited
```

## Breadth-First Search (BFS)

BFS explores all neighbors at depth k before moving to depth k+1. This makes it the algorithm for **shortest path in an unweighted graph**:

```python
from collections import deque

def bfs(graph, start):
    visited = {start}
    queue = deque([(start, 0)])  # (node, distance)
    while queue:
        node, dist = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))
```

## Grid as a Graph

2D grids are implicit graphs. Each cell is a node; neighbors are adjacent cells (4-directional or 8-directional):

```python
def num_islands(grid):
    rows, cols = len(grid), len(grid[0])
    visited = set()
    islands = 0

    def dfs(r, c):
        if (r, c) in visited or not (0 <= r < rows) or not (0 <= c < cols) or grid[r][c] == '0':
            return
        visited.add((r, c))
        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
            dfs(r + dr, c + dc)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1' and (r, c) not in visited:
                dfs(r, c)
                islands += 1
    return islands
```

## Cycle Detection

**Undirected graph**: during DFS, if you reach a visited node that is not the direct parent, there is a cycle.

**Directed graph**: use three states — unvisited (0), in current path (1), completed (2). A cycle exists if you reach a node in state 1:

```python
def has_cycle_directed(graph, n):
    state = [0] * n  # 0: unvisited, 1: in stack, 2: done

    def dfs(node):
        state[node] = 1
        for neighbor in graph[node]:
            if state[neighbor] == 1:
                return True
            if state[neighbor] == 0 and dfs(neighbor):
                return True
        state[node] = 2
        return False

    return any(dfs(i) for i in range(n) if state[i] == 0)
```

## Topological Sort

For a directed acyclic graph (DAG), topological sort orders nodes so every edge points from earlier to later in the order. Used for dependency resolution, course scheduling:

```python
from collections import deque

def topo_sort(n, prerequisites):
    in_degree = [0] * n
    graph = [[] for _ in range(n)]
    for a, b in prerequisites:
        graph[b].append(a)
        in_degree[a] += 1

    queue = deque(i for i in range(n) if in_degree[i] == 0)
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return order if len(order) == n else []  # empty if cycle detected
```

This is **Kahn's algorithm** (BFS-based topological sort).

## DFS vs BFS: When to Use Which

| Use DFS when... | Use BFS when... |
|-----------------|-----------------|
| Exploring all paths | Finding shortest path |
| Cycle detection | Level-order problems |
| Topological sort (DFS variant) | "Minimum steps" problems |
| Connected components | Bidirectional search |
| Backtracking problems | Spreading simulations |

## Common Problem Types

| Problem | Algorithm |
|---------|-----------|
| Shortest path (unweighted) | BFS |
| Shortest path (weighted, non-negative) | Dijkstra (heap + BFS) |
| All pairs shortest path | Floyd-Warshall |
| Course schedule / dependency order | Topological sort |
| Number of connected components | DFS/BFS + visited set |
| Clone graph | DFS + hash map |

## Summary

Graph problems look intimidating until you realize they follow a small set of templates. The key skills are: (1) recognizing that a problem is a graph problem, (2) deciding on a representation, (3) choosing DFS vs BFS based on what you need. Grids, trees, and state-space problems are all graphs in disguise — practice seeing them that way.
