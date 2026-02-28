---
title: "Redis Deep Dive"
date: "2024-02-17"
description: "Redis data structures with real-world use cases, persistence (RDB vs AOF), clustering, Pub/Sub, and implementing distributed locks with Redlock"
tags: ["System Design", "Redis", "Caching", "Distributed Systems"]
---

## Why It Matters

Redis is the most widely-deployed in-memory data store. It's not just a cache — it's a versatile data structure server used for sessions, leaderboards, pub/sub messaging, rate limiting, distributed locks, and more. Understanding Redis deeply lets you solve problems elegantly that would otherwise require much more complex solutions.

---

## Data Structures & Use Cases

### String

The simplest type — a key maps to a binary-safe string.

```bash
SET user:1:name "Alice"
GET user:1:name          # → "Alice"
INCR user:1:visits       # Atomic increment
SETNX lock_key 1         # Set if not exists (distributed lock)
SET session:abc123 "{json...}" EX 3600  # With TTL
```

**Use cases**: Sessions, caching arbitrary objects, distributed counters, atomic flags

### Hash

A map of field → value pairs, like a mini-dictionary.

```bash
HSET user:1 name "Alice" email "alice@example.com" age 30
HGET user:1 name    # → "Alice"
HGETALL user:1      # → all fields
HINCRBY user:1 age 1  # Atomic field increment
```

**Use cases**: User profiles, product catalogs, any structured object

**Why not just store JSON string?** With Hashes, you can update a single field atomically without fetching and re-serializing the whole object.

### List

An ordered list of strings (doubly-linked list). Supports push/pop from both ends.

```bash
LPUSH queue job1 job2 job3     # Push to left
RPOP queue                     # Pop from right (FIFO)
LRANGE queue 0 -1              # Get all elements
LLEN queue                     # Length
BLPOP queue 30                 # Blocking pop (wait up to 30s)
```

**Use cases**: Job queues, activity feeds, recent items list, message queues (lightweight)

### Set

Unordered collection of unique strings.

```bash
SADD friends:1 user2 user3 user4
SISMEMBER friends:1 user2     # → 1 (is member)
SCARD friends:1               # → 3 (size)
SINTER friends:1 friends:2    # Mutual friends (intersection)
SUNION friends:1 friends:2    # All friends (union)
```

**Use cases**: Unique visitors, tagging, mutual friends, deduplication

### Sorted Set (ZSet)

Like Set but each member has a **score** (float). Members sorted by score.

```bash
ZADD leaderboard 1500 alice 2000 bob 1200 charlie
ZREVRANGE leaderboard 0 9 WITHSCORES  # Top 10 (high → low)
ZRANK leaderboard alice                # Rank of alice
ZINCRBY leaderboard 50 alice          # Add 50 points to alice
ZRANGEBYSCORE leaderboard 1000 2000   # Users with scores 1000–2000
```

**Use cases**: Leaderboards, rate limiting (sliding window), event scheduling (score = timestamp), priority queues

### Bitmap

Treat a string as an array of bits. Memory-efficient for large boolean arrays.

```bash
SETBIT user:1:logins 100 1  # Day 100: logged in
GETBIT user:1:logins 100    # → 1
BITCOUNT user:1:logins      # How many days logged in
BITOP AND result bitmap1 bitmap2  # Intersection
```

**Use cases**: Daily active user tracking (1 bit per user per day), feature flags, presence tracking

### HyperLogLog

Probabilistic data structure for cardinality estimation. Fixed memory (~12 KB) regardless of set size.

```bash
PFADD unique_ips 1.2.3.4 5.6.7.8 1.2.3.4  # Duplicates ignored
PFCOUNT unique_ips  # Approximate count (0.81% error)
```

**Use cases**: Unique visitor counts, distinct query counting, when exact count isn't required

---

## Persistence

Redis is in-memory, but you usually want durability.

### RDB (Redis Database Backup)

Point-in-time snapshots of the entire dataset saved to disk.

```bash
# redis.conf
save 900 1    # Save if 1 key changed in 900 seconds
save 300 10   # Save if 10 keys changed in 300 seconds
save 60 10000 # Save if 10,000 keys changed in 60 seconds
```

- Redis forks a child process to write the snapshot (copy-on-write)
- Fast restart (single file to load)
- **Risk**: Data between snapshots is lost on crash

### AOF (Append Only File)

Log every write command to a file. On restart, replay the log.

```bash
# redis.conf
appendonly yes
appendfsync everysec  # Sync to disk every second
# Options: always (slowest, safest) | everysec (good balance) | no (fastest, OS decides)
```

- More durable than RDB (at most 1 second of data loss with `everysec`)
- AOF file grows large; Redis compacts it with **BGREWRITEAOF**
- Slower restart (must replay log)

### Hybrid: RDB + AOF

Use RDB for fast restarts + AOF for durability. The standard recommendation for production.

---

## Redis Clustering

Single Redis instance: limited by RAM of one machine. Redis Cluster handles horizontal scaling.

### Architecture

```
Master 1 (slots 0–5460)     → Replica 1a, Replica 1b
Master 2 (slots 5461–10922) → Replica 2a
Master 3 (slots 10923–16383) → Replica 3a
```

- Data sharded across masters using **hash slots** (16,384 total)
- Each key maps to `CRC16(key) % 16384`
- Masters replicate to their replicas for HA

### Hash Tags for Multi-Key Operations

If you need multi-key operations on the same slot, use hash tags `{}`:

```bash
SET {user:1}:profile "..."
SET {user:1}:timeline "..."
# Both keys hash by "user:1" → same slot → same master
MGET {user:1}:profile {user:1}:timeline  # Works in cluster
```

---

## Pub/Sub

Redis Pub/Sub provides fire-and-forget messaging.

```bash
# Subscriber (in one Redis connection)
SUBSCRIBE notifications:user:123

# Publisher (in another connection)
PUBLISH notifications:user:123 '{"type":"like","from":"alice"}'
```

**Characteristics**:
- Messages not persisted — if subscriber is offline, they miss the message
- At-most-once delivery
- No acknowledgment

**Use cases**: Real-time notifications (where missing one is OK), chat presence updates, live dashboards

**For reliable messaging**: Use Redis Streams or Kafka instead.

---

## Redis Streams

Redis Streams (added in 5.0) is a persistent, append-only log — similar to Kafka but lighter-weight.

```bash
XADD events * type "click" user_id "123"
XREAD COUNT 10 STREAMS events 0  # Read from start
XREADGROUP GROUP workers consumer1 COUNT 10 STREAMS events >  # Consumer group
XACK events workers message-id  # Acknowledge processing
```

**Use cases**: Event sourcing, activity logs, inter-service messaging where you need persistence

---

## Distributed Locks with Redlock

For simple distributed locks on a single Redis instance:

```python
# Acquire lock
acquired = redis.set("lock:resource", token, nx=True, ex=30)
# nx=True: only set if key doesn't exist
# ex=30: auto-expire after 30 seconds (safety net)

if acquired:
    try:
        # Do work
        pass
    finally:
        # Release lock (check token to avoid releasing someone else's lock)
        if redis.get("lock:resource") == token:
            redis.delete("lock:resource")
```

**Redlock** is a distributed lock algorithm using N independent Redis masters (usually 5). It acquires the lock on a majority (≥ 3) of the masters within a timeout.

**Note**: Redlock's safety properties are debated (see Martin Kleppmann's critique). For critical sections requiring absolute correctness, use ZooKeeper or etcd-based locks instead.

---

## Interview Tips

**Sorted sets for leaderboards and rate limiting**: "I'd use a Redis sorted set with timestamps as scores for a sliding window rate limiter. Members are request IDs, scores are timestamps — expire old entries with `ZREMRANGEBYSCORE`."

**Why Redis over Memcached?** "Redis supports richer data structures (sorted sets, streams, pub/sub), persistence, and atomic operations. Memcached is simpler and marginally faster for pure key-value caching."

**Redis for session storage**: "I'd store sessions in Redis with a 24-hour TTL. Redis's native `EXPIRE` makes session management trivial."

**Cluster for scale**: "A single Redis instance can handle ~100K ops/sec. For higher throughput, Redis Cluster shards data across multiple primaries."
