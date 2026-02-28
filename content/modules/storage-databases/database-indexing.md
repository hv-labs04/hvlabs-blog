---
title: "Database Indexing Deep Dive"
date: "2024-02-03"
description: "B-tree indexes, composite indexes, covering indexes, EXPLAIN plans, and solving the N+1 problem — everything you need to write fast queries"
tags: ["System Design", "Databases", "Indexing", "Performance"]
---

## Why It Matters

Indexes are the single most impactful performance optimization available in databases. A query that takes 10 seconds on a table scan might run in 1 millisecond with the right index. In system design, you need to think about indexes when designing your schema — not after you've built the system and it's slow.

---

## How Indexes Work

An index is a separate data structure that maintains a sorted copy of one or more columns, with pointers back to the original row. The database uses it to avoid full table scans.

**Without index** (table scan):
```
SELECT * FROM users WHERE email = 'alice@example.com';
-- Database reads every row: O(n) — slow on large tables
```

**With index on email** (B-tree lookup):
```sql
CREATE INDEX idx_users_email ON users(email);
-- Database traverses B-tree: O(log n) — fast even with millions of rows
```

---

## B-Tree Indexes (The Default)

B-trees (Balanced trees) are the default index structure in PostgreSQL, MySQL, Oracle, and SQL Server.

**Structure**:
- Balanced tree of sorted keys
- All leaves at the same depth
- Each leaf node stores key + pointer to row
- Internal nodes guide the search

**B-tree advantages**:
- Efficient for equality (`=`) and range queries (`>`, `<`, `BETWEEN`)
- Supports `ORDER BY` without sorting
- Supports `LIKE 'prefix%'` (but not `LIKE '%suffix'`)
- Logarithmic lookup: O(log n)

**B-tree limitations**:
- Cannot accelerate `LIKE '%suffix%'` searches
- Not efficient for very high cardinality UUID keys at insert time (page splits)
- Index takes space (10–30% of table size typically)

---

## Index Types

### Hash Index
- Exact equality lookups only (`=`)
- O(1) lookup, no range queries
- Used internally by Redis, PostgreSQL heap-based hash indexes

### Composite Index (Multi-Column)

An index on multiple columns together:

```sql
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);
```

**The leftmost prefix rule**: A composite index on `(A, B, C)` can efficiently serve queries on `A`, `(A, B)`, or `(A, B, C)` — but NOT `B` or `C` alone.

```sql
-- USES index (user_id is leftmost prefix)
SELECT * FROM orders WHERE user_id = 123;

-- USES index (both columns)
SELECT * FROM orders WHERE user_id = 123 AND created_at > '2024-01-01';

-- DOES NOT use index efficiently (missing user_id)
SELECT * FROM orders WHERE created_at > '2024-01-01';
```

**Design principle**: Order columns in a composite index as: equality conditions first, then range conditions, then columns for ordering.

### Covering Index

A covering index includes all columns needed by a query, so the database never touches the actual table rows.

```sql
-- Query: get email and name for all users in a specific city
SELECT email, name FROM users WHERE city = 'San Francisco';

-- Covering index: includes all columns the query needs
CREATE INDEX idx_users_city_email_name ON users(city, email, name);
-- Database satisfies the query entirely from the index — no table heap access
```

**This is called an "index-only scan"** — often 2–5× faster than a regular index scan.

### Full-Text Index

For searching text content:
```sql
-- PostgreSQL
CREATE INDEX idx_posts_search ON posts USING GIN(to_tsvector('english', content));
SELECT * FROM posts WHERE to_tsvector('english', content) @@ to_tsquery('system & design');
```

### Partial Index

Index only a subset of rows:
```sql
-- Only index active users (most queries filter on active=true)
CREATE INDEX idx_active_users ON users(email) WHERE active = true;
-- Smaller index, faster, less storage
```

---

## Reading EXPLAIN Output

`EXPLAIN ANALYZE` shows how the query planner executes a query:

```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123 ORDER BY created_at DESC LIMIT 10;
```

**Output to understand**:

```
Index Scan using idx_orders_user_date on orders
  (cost=0.56..8.58 rows=10 width=156)
  (actual time=0.05..0.12 rows=10 loops=1)
  Index Cond: (user_id = 123)
```

| Term | Meaning |
|------|---------|
| **Seq Scan** | Full table scan — bad for large tables |
| **Index Scan** | Using B-tree index — good |
| **Index Only Scan** | Covering index used — excellent |
| **Bitmap Heap Scan** | Index to find pages, then read pages — medium |
| **cost** | Planner's estimated cost (arbitrary units) |
| **rows** | Estimated row count |
| **actual time** | Real execution time in ms |

**Red flags**: `Seq Scan` on large tables, `rows` estimate very different from actual, `Sort` node (unindexed ORDER BY).

---

## The N+1 Problem

The N+1 problem is when code executes 1 query to get a list, then N additional queries to get related data for each item.

```python
# Bad: N+1 queries
posts = db.query("SELECT * FROM posts LIMIT 100")  # 1 query
for post in posts:
    author = db.query(f"SELECT * FROM users WHERE id = {post.user_id}")  # 100 queries!
    # Total: 101 queries
```

```python
# Good: 2 queries (eager loading)
posts = db.query("SELECT * FROM posts LIMIT 100")
user_ids = [p.user_id for p in posts]
users = db.query(f"SELECT * FROM users WHERE id IN ({','.join(user_ids)})")
user_map = {u.id: u for u in users}
# Total: 2 queries
```

Or use a JOIN:
```sql
SELECT posts.*, users.name, users.avatar
FROM posts
JOIN users ON posts.user_id = users.id
LIMIT 100;
-- Total: 1 query
```

**N+1 in ORMs**: This is extremely common with ORMs (Django, ActiveRecord, SQLAlchemy). Use eager loading (`select_related`, `include`, `joinedload`) or explicitly batch your queries.

---

## Index Design Guidelines

**Do index**:
- Foreign keys (always — JOINs and cascades are brutal without them)
- Columns in WHERE clauses on large tables
- Columns used for JOIN conditions
- Columns in ORDER BY / GROUP BY on frequent queries

**Don't over-index**:
- Every write must update every index — too many indexes slow writes
- Low-cardinality columns (e.g., `status` with 3 values) — index rarely helps
- Very small tables — table scan is faster than index overhead

**Rule of thumb**: Start lean, add indexes when you see slow queries in production. Use EXPLAIN to verify the index is being used.

---

## Interview Tips

**Mention indexes when designing your schema**: "I'd index `user_id` on the posts table since we'll frequently query posts by user."

**Talk about composite index ordering**: "For the timeline query — `WHERE user_id = ? ORDER BY created_at DESC` — I'd create a composite index on `(user_id, created_at DESC)`."

**Acknowledge the write overhead**: "Every index adds write overhead. For an analytics table that gets millions of inserts per hour, we'd be careful about how many indexes we create."

**Bring up the N+1 problem when discussing ORM layers**: It demonstrates practical engineering experience.
