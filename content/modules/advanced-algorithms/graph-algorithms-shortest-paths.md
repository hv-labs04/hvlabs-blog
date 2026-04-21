---
title: "Graph Algorithms: Shortest Paths"
slug: "graph-algorithms-shortest-paths"
date: "2024-04-01"
description: "Dijkstra's, Bellman-Ford, and Floyd-Warshall — when to use each and how they work"
tags: ["dsa", "graphs", "dijkstra", "shortest-path", "advanced"]
featured: false
draft: false
module: "advanced-algorithms"
moduleOrder: 1
---

Shortest path algorithms are among the most practically useful in computer science — they underpin GPS navigation, network routing, dependency resolution, and game AI. Knowing which algorithm applies when is as important as knowing how to implement them.

## Problem Variants

| Problem | Constraint | Algorithm | Complexity |
|---------|-----------|-----------|-----------|
| Single-source, unweighted | No weights | BFS | O(V + E) |
| Single-source, non-negative weights | w(e) ≥ 0 | Dijkstra | O((V+E) log V) |
| Single-source, any weights | May have negative edges | Bellman-Ford | O(V·E) |
| All-pairs | Dense graphs | Floyd-Warshall | O(V³) |
| DAG shortest path | Directed, acyclic | Topo sort + relax | O(V + E) |

## BFS for Unweighted Graphs

When all edges have equal weight (or no weight), BFS finds shortest paths. Each level of BFS corresponds to one "hop":

```python
from collections import deque

def shortest_path(graph, src, dst):
    dist = {src: 0}
    queue = deque([src])
    while queue:
        node = queue.popleft()
        if node == dst:
            return dist[node]
        for neighbor in graph[node]:
            if neighbor not in dist:
                dist[neighbor] = dist[node] + 1
                queue.append(neighbor)
    return -1
```

## Dijkstra's Algorithm

For weighted graphs with non-negative edge weights. Maintains a min-heap of (distance, node) pairs — always processes the unvisited node with the smallest known distance:

```python
import heapq

def dijkstra(graph, src):
    """graph: {node: [(neighbor, weight), ...]}"""
    dist = {src: 0}
    heap = [(0, src)]  # (distance, node)
    while heap:
        d, node = heapq.heappop(heap)
        if d > dist.get(node, float('inf')):
            continue  # stale entry
        for neighbor, weight in graph[node]:
            new_dist = d + weight
            if new_dist < dist.get(neighbor, float('inf')):
                dist[neighbor] = new_dist
                heapq.heappush(heap, (new_dist, neighbor))
    return dist
```

**Why non-negative weights only?** Dijkstra's greedy assumption is that once a node is processed with distance `d`, no shorter path exists. A negative edge could provide a shortcut after the node is processed, violating this assumption.

### Time Complexity

With a binary heap: O((V + E) log V). Each node is processed once, each edge potentially triggers a heap push.

With a Fibonacci heap: O(E + V log V) — better for dense graphs, but rarely implemented in practice.

## Bellman-Ford

Handles negative edge weights and detects negative cycles. Relaxes all edges V−1 times:

```python
def bellman_ford(n, edges, src):
    """edges: [(u, v, weight), ...]"""
    dist = [float('inf')] * n
    dist[src] = 0
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    # Check for negative cycles
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            return None  # negative cycle exists
    return dist
```

Why V−1 iterations? A shortest path in a graph with V nodes has at most V−1 edges. Each iteration guarantees that paths of length at most `k` are correctly computed after the k-th pass.

**Negative cycle detection**: if a V-th relaxation still improves a distance, a negative cycle exists.

## Floyd-Warshall

All-pairs shortest paths in O(V³). Uses dynamic programming: `dp[k][i][j]` = shortest path from i to j using only nodes 0..k as intermediates.

```python
def floyd_warshall(n, edges):
    dist = [[float('inf')] * n for _ in range(n)]
    for i in range(n):
        dist[i][i] = 0
    for u, v, w in edges:
        dist[u][v] = w

    for k in range(n):          # intermediate node
        for i in range(n):      # source
            for j in range(n):  # destination
                dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])

    return dist
```

**Negative cycle detection**: if `dist[i][i] < 0` for any i after the algorithm, a negative cycle exists.

## Shortest Path in a DAG

For directed acyclic graphs, topological ordering + one relaxation pass gives O(V + E) — faster than Dijkstra:

```python
def dag_shortest_path(graph, src, n):
    from collections import deque
    # Kahn's algorithm for topo sort
    in_degree = [0] * n
    for u in range(n):
        for v, _ in graph[u]:
            in_degree[v] += 1
    queue = deque(i for i in range(n) if in_degree[i] == 0)
    topo = []
    while queue:
        node = queue.popleft()
        topo.append(node)
        for v, _ in graph[node]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)

    dist = [float('inf')] * n
    dist[src] = 0
    for u in topo:
        for v, w in graph[u]:
            dist[v] = min(dist[v], dist[u] + w)
    return dist
```

## Choosing the Right Algorithm

```
Has negative weights?
  ├─ Yes → Bellman-Ford (single source) or Floyd-Warshall (all pairs)
  └─ No
      Is the graph unweighted?
        ├─ Yes → BFS
        └─ No
            Is it a DAG?
              ├─ Yes → Topological sort + relax
              └─ No → Dijkstra (single source) or Floyd-Warshall (all pairs)
```

## Network Delay Time (LeetCode 743)

Classic Dijkstra application: find the time for a signal to reach all nodes:

```python
def network_delay_time(times, n, k):
    graph = {i: [] for i in range(1, n+1)}
    for u, v, w in times:
        graph[u].append((v, w))

    dist = dijkstra(graph, k)
    max_dist = max(dist.get(i, float('inf')) for i in range(1, n+1))
    return max_dist if max_dist < float('inf') else -1
```

## Summary

The choice of shortest-path algorithm is a design decision, not a memorization problem. BFS for unweighted, Dijkstra for weighted non-negative, Bellman-Ford for negative weights, Floyd-Warshall for all-pairs. Internalizing *why* each algorithm works — the invariant it maintains — makes it much easier to adapt them to problem variants.
