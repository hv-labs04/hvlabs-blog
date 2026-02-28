---
title: "Database Sharding"
date: "2024-02-07"
description: "Hash vs range sharding, consistent hashing, hotspots, and resharding strategies — how to horizontally scale databases beyond a single machine"
tags: ["System Design", "Databases", "Sharding", "Scalability"]
---

## Why It Matters

Replication scales reads. Sharding scales writes. When a single database server can't handle your write throughput or data volume, sharding is how you split the data across multiple servers. It's one of the most complex topics in system design — and one of the most commonly asked about.

---

## What Is Sharding?

Sharding (also called **horizontal partitioning**) splits a single database into multiple smaller databases, each called a **shard**. Each shard holds a subset of the data and operates independently.

```
Total data: 1 TB, 10M users

Shard 1: users 0–2.5M   (250 GB)
Shard 2: users 2.5M–5M  (250 GB)
Shard 3: users 5M–7.5M  (250 GB)
Shard 4: users 7.5M–10M (250 GB)
```

The **shard key** (also called partition key) determines which shard a piece of data lives on.

---

## Sharding Strategies

### Hash-Based Sharding

Apply a hash function to the shard key, then use modulo to determine the shard.

```
shard_id = hash(user_id) % num_shards
```

**Example** with 4 shards:
- user_id 123 → hash → 1,234,567 % 4 → Shard 1
- user_id 456 → hash → 9,876,543 % 4 → Shard 3

**Pros**:
- Uniform data distribution (no hot spots if keys are random)
- Simple to implement

**Cons**:
- No range queries across shards (no "get all users created this week")
- Adding/removing shards requires **rehashing all data** (very expensive)

### Range-Based Sharding

Divide data into sorted ranges, each range assigned to a shard.

```
Shard 1: user_id 1 – 2,500,000
Shard 2: user_id 2,500,001 – 5,000,000
Shard 3: user_id 5,000,001 – 7,500,000
Shard 4: user_id 7,500,001 – 10,000,000
```

**Pros**:
- Supports range queries within a shard
- Easy to reason about data location

**Cons**:
- **Hotspot risk**: If users 1–1,000 are all newly signed up celebrities, Shard 1 gets hammered
- Adding ranges requires remapping

### Directory-Based Sharding

A lookup service maps shard keys to shard IDs.

```
Lookup service:
  user_id 123 → Shard 2
  user_id 456 → Shard 1
  user_id 789 → Shard 4
```

**Pros**: Maximum flexibility, easy to rebalance
**Cons**: Lookup service is a single point of failure and performance bottleneck; must be highly available

---

## Consistent Hashing

Standard hash sharding requires full data reshuffling when you add/remove shards. **Consistent hashing** minimizes reshuffling.

### How It Works

1. Imagine a hash ring (0 to 2^32 - 1)
2. Each server is placed on the ring at `hash(server_id)`
3. Each key maps to the first server clockwise from `hash(key)`

```
      Server A (hash=0)
         ↑
    Key3 (hash=350)
  ←Ring→
Server D   Server B
(hash=270)  (hash=90)
         ↓
    Server C (hash=180)
    Key1 (hash=150) → Server C
    Key2 (hash=200) → Server D
```

**Adding a server**: Only keys between the new server and its predecessor migrate. ~1/n of all data moves.

**Removing a server**: Only that server's keys move to the next server. ~1/n of all data moves.

**vs. modulo hashing**: Adding 1 server to modulo hashing requires remapping almost all keys (from `n` to `n+1` shards). Consistent hashing only remaps ~1/n of keys.

### Virtual Nodes

Problem: Without virtual nodes, servers may be unevenly distributed on the ring.

Solution: Each physical server is assigned multiple positions on the ring (e.g., 150 virtual nodes per server). This creates a more uniform distribution.

Used by: **Cassandra**, **Amazon DynamoDB**, **Chord**, **Riak**

---

## Hotspot Problem

A hotspot occurs when a shard key concentrates too many requests on one shard.

**Examples**:
- A celebrity with 50M followers — all their data on one shard
- Time-based sharding where today's date is always a hot shard
- A trending hashtag routes all tweets to one shard

**Mitigation strategies**:

1. **Add a random suffix**: `user_id_0`, `user_id_1`, ..., `user_id_9` — 10 shards for one user's data. Reads must query all 10 and merge.

2. **Pre-split hot keys**: Identify VIP users in advance and distribute their data manually.

3. **Application-level routing**: Detect hot keys and route to multiple shards.

4. **Celebrity/VIP handling**: Maintain a separate "hot users" table with different sharding.

---

## Resharding (Rebalancing)

When shards fill up or load grows unevenly, you need to rebalance.

**Strategies**:

1. **Add a new shard and migrate half of a hot shard's data**: Requires careful coordination, usually done during low-traffic periods.

2. **Consistent hashing re-assignment**: Add a virtual node, keys automatically migrate.

3. **Double-write during migration**: Write to both old and new shard, verify, then cut over.

**The real challenge**: Resharding in a live system without downtime requires careful orchestration. Shopify, GitHub, and Slack have all written about painful sharding migrations.

---

## Cross-Shard Queries and Transactions

Sharding breaks:
- **JOINs across shards**: Must scatter-gather (query all shards, merge in app)
- **Cross-shard transactions**: No atomic commits across different servers (no distributed ACID easily)

**Solutions**:
- Design your shard key so related data lives on the same shard (e.g., all data for one user on the same shard)
- Accept eventual consistency for cross-shard operations
- Use a distributed transaction protocol (2PC) — expensive and complex

---

## When to Shard

Sharding is expensive to implement and operate. Don't do it prematurely.

**First exhaust these options**:
1. Add read replicas for read scale
2. Add better indexes and optimize queries
3. Upgrade to a larger instance (vertical scale)
4. Add caching (Redis) to reduce DB load

**Consider sharding when**:
- Your primary database write QPS consistently exceeds what one server can handle
- Your total data volume exceeds what one server can hold reasonably
- Adding read replicas doesn't help (you're write-bound, not read-bound)

---

## Interview Tips

**State your shard key choice and justify it**: "I'd shard by `user_id` using consistent hashing. This keeps all of a user's data on one shard, enabling fast user-centric queries without cross-shard joins."

**Acknowledge the hotspot problem**: "For celebrity accounts, standard hash sharding creates a hotspot. I'd handle this by adding a random suffix to the shard key for accounts above a follower threshold."

**Consistent hashing vs modulo**: Mentioning consistent hashing over simple modulo sharding shows you understand operational concerns, not just the happy path.

**Cross-shard queries**: "Cross-shard queries are expensive — we'd need to scatter-gather across all shards and merge in the application layer. I'd design the data model to avoid this for hot paths."
