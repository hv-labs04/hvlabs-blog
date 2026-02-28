---
title: "SQL vs NoSQL: Choosing the Right Database"
date: "2024-02-01"
description: "ACID vs BASE, when to use relational vs document vs wide-column vs graph databases, and how real companies make these choices"
tags: ["System Design", "Databases", "SQL", "NoSQL"]
---

## Why It Matters

"Would you use SQL or NoSQL?" is one of the most frequent system design interview questions. The right answer is never "NoSQL is more scalable" — it depends entirely on your access patterns, consistency requirements, and data model.

---

## ACID vs BASE

### ACID (Relational databases)

| Property | Meaning |
|----------|---------|
| **Atomicity** | Transaction fully completes or fully rolls back |
| **Consistency** | Data always satisfies defined constraints |
| **Isolation** | Concurrent transactions don't interfere |
| **Durability** | Committed data survives crashes |

### BASE (Most NoSQL databases)

| Property | Meaning |
|----------|---------|
| **Basically Available** | System stays available under failures |
| **Soft state** | State may change without input (replication) |
| **Eventually consistent** | Nodes will converge to the same state |

**Key insight**: ACID is about correctness guarantees. BASE trades some correctness for availability and scale. Neither is better — they're tools for different jobs.

---

## Relational Databases (SQL)

**When to choose SQL**:
- Complex relationships between entities
- Need for ACID transactions (financial data, inventory)
- Ad-hoc queries and reporting (you don't know all access patterns)
- Team knows SQL well and data fits structured schema

**Strengths**:
- Mature, battle-tested (PostgreSQL, MySQL, CockroachDB)
- Powerful JOIN operations
- Schema enforcement prevents bad data
- Rich query language (SQL)

**Limitations**:
- Horizontal scaling is hard (vertical scale or complex sharding)
- Schema changes can be expensive on large tables
- Impedance mismatch with object-oriented code

**Best for**: Banking systems, e-commerce orders, user accounts, CRM, any system where relationships and transactions matter.

---

## Document Databases

**Examples**: MongoDB, Firestore, Couchbase

**Model**: JSON-like documents, flexible schema per document

**When to choose**:
- Data naturally fits a hierarchical/nested model
- Schema evolves frequently
- Access patterns are well-known and document-centric

**Classic example**: A blog post with comments, tags, and metadata — all stored as one document. No joins needed.

```json
{
  "_id": "post_123",
  "title": "System Design 101",
  "content": "...",
  "author": { "id": "user_1", "name": "Vishnu" },
  "tags": ["system-design", "backend"],
  "comments": [
    { "user": "alice", "text": "Great post!", "ts": "2024-01-01" }
  ]
}
```

**Weakness**: Multi-document transactions were historically weak (MongoDB added them in 4.0). Deeply nested queries get complex.

---

## Wide-Column Databases (Column-Family)

**Examples**: Apache Cassandra, HBase, Google Bigtable

**Model**: Rows with flexible columns, optimized for specific query patterns at massive scale

**When to choose**:
- Write-heavy at massive scale (millions of writes/sec)
- Time-series data or append-heavy workloads
- Known access patterns (no ad-hoc queries)

**Classic example**: IoT sensor data, activity logs, user event streams

```
# Cassandra table — optimized for "get all events for user X"
CREATE TABLE user_events (
  user_id UUID,
  event_time TIMESTAMP,
  event_type TEXT,
  metadata MAP<TEXT, TEXT>,
  PRIMARY KEY (user_id, event_time)
) WITH CLUSTERING ORDER BY (event_time DESC);
```

**Cassandra's design**: Data is partitioned by partition key, sorted by clustering key. Write to multiple nodes simultaneously (no single master). **AP system** — available under partitions, eventually consistent.

**Weakness**: No joins, no ACID transactions, schema must match query patterns.

---

## Key-Value Stores

**Examples**: Redis, DynamoDB, Riak

**Model**: Simple key → value lookup, extremely fast

**When to choose**:
- Caching (session data, computed results)
- Distributed locks
- Rate limiting counters
- Simple lookups where key is always known

**Weakness**: No querying by value; you must know the key.

---

## Graph Databases

**Examples**: Neo4j, Amazon Neptune

**Model**: Nodes and edges. Optimized for traversal queries.

**When to choose**:
- Social networks (friends of friends)
- Recommendation engines
- Fraud detection (follow money trails)
- Knowledge graphs

**Classic use case**: "Find all users within 3 degrees of connection to User X" — impossible efficiently in SQL, trivial in a graph DB.

**Weakness**: Niche use case, harder operational expertise.

---

## Database Selection Decision Tree

```
Does your data have complex relationships requiring transactions?
  → YES → SQL (PostgreSQL, CockroachDB)

Is it document-shaped and schema-flexible?
  → YES → Document DB (MongoDB)

Is it massive write volume + known query patterns?
  → YES → Wide-column (Cassandra, HBase)

Is it primarily key lookups + caching?
  → YES → Key-value (Redis, DynamoDB)

Does your data form a graph with traversal queries?
  → YES → Graph DB (Neo4j)
```

---

## Real-World Database Choices

| Company | Use Case | Database | Why |
|---------|----------|----------|-----|
| Instagram | User profiles, posts | PostgreSQL | ACID, complex queries |
| Instagram | Media object storage metadata | Cassandra | High write throughput |
| Twitter | Tweets | MySQL + Cassandra | MySQL for original data, Cassandra for timelines |
| Netflix | Movie catalog | Cassandra | Global scale, high availability |
| Uber | Trip data | MySQL + Riak | Historical trips in MySQL, real-time state in Riak |
| LinkedIn | Social graph | Custom (Voldemort) | Graph traversal at scale |
| Discord | Chat messages | Cassandra | Append-heavy, time-ordered |

---

## Interview Tips

**Don't just say "NoSQL scales better"**: Relational databases like Google Spanner, CockroachDB, and Aurora are highly scalable. The real trade-off is consistency vs availability, schema flexibility, and access patterns.

**Polyglot persistence is normal**: Real systems use multiple databases. "I'd use PostgreSQL for user accounts and financial transactions, Redis for caching and sessions, Cassandra for the event log."

**Ask about access patterns first**: The right database is determined by how you read data, not just how you store it.

**Mention the operational cost**: "Cassandra is powerful but operationally complex — you need expertise to tune it. For a small team, PostgreSQL might be better even at moderate scale."
