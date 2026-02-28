---
title: "Caching Strategies"
date: "2024-02-15"
description: "Cache-aside, read-through, write-through, write-behind — every caching pattern explained with eviction policies, thundering herd prevention, and when to use each"
tags: ["System Design", "Caching", "Redis", "Performance"]
---

## Why It Matters

Caching is the single most effective tool for reducing latency and database load. A well-designed cache can serve 99% of reads from memory at microsecond latency, completely bypassing the database. Done wrong, it causes stale data, cache stampedes, and cache poisoning.

---

## Core Concepts

### Cache Hit vs Miss

- **Cache hit**: Data found in cache — serve immediately (~1 ms from Redis)
- **Cache miss**: Data not in cache — fetch from DB, store in cache, serve (~50 ms from DB)

**Hit rate** = hits / (hits + misses). A hit rate below 90% means your cache isn't helping much; below 70% means you might be making things worse (cache overhead + DB load).

### Cache Invalidation

> "There are only two hard things in computer science: cache invalidation and naming things."
> — Phil Karlton

Cache invalidation means updating or removing cached data when the source data changes. Getting this wrong causes stale data bugs.

---

## Caching Patterns

### Cache-Aside (Lazy Loading)

The most common pattern. Application code manages the cache explicitly.

```python
def get_user(user_id):
    # 1. Check cache
    cached = redis.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)  # Cache hit

    # 2. Cache miss — load from DB
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)

    # 3. Store in cache with TTL
    redis.setex(f"user:{user_id}", 3600, json.dumps(user))

    return user
```

**Pros**:
- Only caches what's requested (no wasted memory)
- Cache failure doesn't break the app (just slower)
- Cache schema can differ from DB schema

**Cons**:
- **Cache miss penalty**: First request is slow
- **Thundering herd**: If cache expires under high load, many requests hit DB simultaneously
- **Stale data**: Cache can lag behind DB changes

**Best for**: Read-heavy workloads where data changes infrequently.

### Read-Through Cache

The cache sits in front of the DB. On a miss, the cache itself fetches from the DB and stores the result.

```
Client → Cache → [hit: return] or [miss: DB → store in cache → return]
```

**Difference from cache-aside**: The application only talks to the cache; the cache talks to the DB.

**Pros**: Application code is simpler (no cache management logic)
**Cons**: Cache must be tightly coupled to DB; harder to customize caching logic

**Examples**: AWS ElastiCache (with Memcached/Redis), DAX (DynamoDB Accelerator)

### Write-Through Cache

Every write goes through the cache first, then to the DB synchronously.

```
Write: Client → Cache → DB (both updated before returning)
Read:  Client → Cache (always fresh)
```

**Pros**: Cache is always in sync with DB (no stale reads)
**Cons**: Write latency increases (must write to both); cache fills with data that may never be read

**Best for**: Systems where cache consistency is critical and you can tolerate slightly slower writes.

### Write-Behind (Write-Back) Cache

Writes go to the cache immediately, DB is updated asynchronously (in the background).

```
Write: Client → Cache (immediate return) → [async] → DB
Read:  Client → Cache
```

**Pros**: Very fast writes (return after cache write, not DB write)
**Cons**: Risk of data loss if cache fails before DB flush; harder to implement correctly

**Best for**: Write-heavy workloads where write latency matters (gaming leaderboards, real-time analytics)

### Write-Around

Writes go directly to DB, bypassing cache. Cache is only populated on reads.

**When to use**: Write-once data that won't be re-read soon (log files, batch data). Prevents polluting the cache with data unlikely to be read.

---

## Eviction Policies

When the cache is full, old entries must be evicted to make room.

| Policy | Description | Best For |
|--------|-------------|---------|
| **LRU** (Least Recently Used) | Evict the item not accessed for the longest time | General purpose |
| **LFU** (Least Frequently Used) | Evict the item accessed fewest times | Workloads with clear popular vs unpopular data |
| **FIFO** | Evict oldest item | Streaming data |
| **TTL** | Evict after a fixed time, regardless of access | Any time-sensitive data |
| **Random** | Evict randomly | Approximating LRU with less overhead |

**Redis default**: LRU (with an approximation algorithm for performance). You can configure it via `maxmemory-policy`.

---

## TTL (Time-to-Live)

TTL defines how long cached data is considered fresh.

**Short TTL (seconds to minutes)**:
- Data changes frequently
- Stale data is costly
- More DB load (more cache misses)

**Long TTL (hours to days)**:
- Data changes rarely (user profile, product catalog)
- Acceptable stale window
- Less DB load

**Absolute vs sliding TTL**:
- Absolute: expires at `created_at + TTL`
- Sliding: expires `TTL` after each access (reset on every read)

Redis supports both: `SET key value EX 3600` (absolute) or reset TTL on each read with `EXPIRE`.

---

## The Thundering Herd Problem

When a popular cache entry expires, thousands of simultaneous requests all get a cache miss and hammer the DB simultaneously.

**Solutions**:

1. **Mutex/Lock**: Only one request fetches from DB; others wait.
   ```python
   if not redis.get(key):
       if redis.setnx(lock_key, 1, ex=10):  # Acquire lock
           data = db.fetch()
           redis.set(key, data, ex=3600)
           redis.delete(lock_key)
       else:
           time.sleep(0.1)  # Wait for lock holder
           return redis.get(key)
   ```

2. **Stale-while-revalidate**: Serve stale data while refreshing in the background.

3. **Jitter on TTL**: Add random jitter to TTL so all similar keys don't expire at the same time.
   ```python
   ttl = 3600 + random.randint(0, 300)  # 1 hour ± 5 minutes
   redis.setex(key, ttl, value)
   ```

4. **Cache warming**: Pre-populate cache before expiry using a background job.

---

## Where to Cache

| Layer | What | How |
|-------|------|-----|
| Browser | Static assets | Cache-Control headers, Service Worker |
| CDN | Static files, API responses | CloudFront, Fastly |
| Application (in-process) | Frequently used config, small datasets | In-memory dict, LRU cache |
| Distributed cache | DB query results, session data, computed objects | Redis, Memcached |
| Database query cache | Result sets | MySQL query cache (deprecated), PgBouncer |

---

## Interview Tips

**Cache-aside is the default**: Unless you have a specific reason to use another pattern, describe cache-aside. It's the most common in production.

**Always mention TTL and invalidation**: "I'd set a 5-minute TTL on the timeline cache. When a user posts, I'd invalidate their followers' timeline caches proactively."

**Thundering herd is a real problem at scale**: "If 10,000 users all have their cache expire simultaneously, the DB would be overwhelmed. I'd add TTL jitter and a background refresh mechanism."

**Don't just say 'add a cache'**: Explain the caching strategy, the key structure, the TTL, and the invalidation approach.
