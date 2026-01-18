---
title: "Designing a URL Shortener"
slug: "designing-a-url-shortener"
date: "2024-01-15"
description: "A deep dive into designing a scalable URL shortener service like bit.ly or TinyURL"
tags: ["system-design", "url-shortener", "distributed-systems", "scalability"]
featured: false
draft: false
module: "system-design-case-studies"
moduleOrder: 1
---

URL shorteners are a classic system design interview problem. They seem simple on the surface—just convert a long URL to a short one, right? But designing one that can handle millions of requests requires careful consideration of scalability, storage, and performance. Let&apos;s walk through designing a production-ready URL shortener step by step, explaining the reasoning behind each decision.

## Understanding the Problem

Before we start designing, let&apos;s understand what we&apos;re building. A URL shortener takes a long URL like:

```
https://www.example.com/articles/2024/01/15/very-long-article-title-that-goes-on-and-on
```

And converts it to something short like:

```
https://short.ly/abc123
```

When someone visits the short URL, they get redirected to the original long URL. Simple concept, but let&apos;s think about what makes this challenging at scale.

## Step 1: Gathering Requirements

### Functional Requirements

Let&apos;s start by defining what our system must do:

1. **Shorten URLs**: Convert long URLs to short, unique aliases
2. **Redirect**: When users access the short URL, redirect to the original URL
3. **Custom Aliases**: Allow users to create custom short URLs (optional but common)
4. **Expiration**: URLs can optionally expire after a set time

**Why these requirements?** The first two are core functionality. Custom aliases are important for branding (companies want `short.ly/mybrand`). Expiration helps manage storage and prevents abuse.

### Non-Functional Requirements

Now, what about performance and scale?

1. **High Availability**: System should be highly available (99.9%+)
2. **Low Latency**: URL redirection should be fast (< 100ms)
3. **Scalable**: Handle 100M+ URLs and 1000+ RPS
4. **Unique**: Short URLs must be unique (no collisions)
5. **Read-Heavy**: Read-to-write ratio is about 100:1

**Why these numbers?** Let&apos;s think about real-world usage:
- People create short URLs occasionally (writes)
- But those URLs get clicked many times (reads)
- A viral link might get millions of clicks
- Users expect instant redirects—any delay feels broken

## Step 2: Capacity Estimation

Before designing, we need to understand the scale. Let&apos;s do some back-of-the-envelope calculations:

### Traffic Estimation

**Assumptions:**
- 100 million URLs stored
- Each URL gets clicked 100 times on average (read-heavy)
- URLs created over 5 years = 100M URLs / (5 years × 365 days) ≈ 55,000 URLs/day
- Daily clicks = 100M URLs × 100 clicks = 10 billion clicks/day

**Calculations:**
- **Write traffic**: 55,000 URLs/day ÷ (24 × 3600) ≈ 0.64 RPS
- **Read traffic**: 10 billion clicks/day ÷ (24 × 3600) ≈ 115,740 RPS
- **Peak traffic**: Assume 3x average = ~350,000 RPS for reads, ~2 RPS for writes

**Why estimate?** These numbers help us understand:
- We need to optimize for reads, not writes
- We&apos;ll need caching aggressively
- Database writes aren&apos;t the bottleneck

### Storage Estimation

**Per URL:**
- Long URL: ~500 bytes average
- Short URL: 7 bytes (we&apos;ll explain why 7 later)
- Metadata (created_at, expiration, user_id): ~50 bytes
- **Total per URL**: ~557 bytes

**Total Storage:**
- 100M URLs × 557 bytes = ~55.7 GB

**Why this matters:** 55GB is manageable. We don&apos;t need complex storage solutions initially, but we&apos;ll need to plan for growth.

### Bandwidth Estimation

**Write bandwidth:**
- 2 RPS × 500 bytes = 1 KB/s (negligible)

**Read bandwidth:**
- 350,000 RPS × 500 bytes = 175 MB/s (significant!)

**Why this matters:** Read bandwidth is high. We&apos;ll need caching and CDN to reduce bandwidth costs.

## Step 3: API Design

Let&apos;s design our APIs. This helps us think about what data we need and how clients will interact with our system.

### Shorten URL API

```
POST /api/v1/shorten
Content-Type: application/json

Request:
{
  "longUrl": "https://example.com/very/long/url",
  "customAlias": "my-custom-link",  // optional
  "expirationDate": "2024-12-31"     // optional
}

Response:
{
  "shortUrl": "https://short.ly/abc123",
  "expirationDate": "2024-12-31"
}
```

**Design decisions:**
- POST because we&apos;re creating a resource
- Custom alias is optional—we&apos;ll generate one if not provided
- Expiration is optional—some URLs should live forever
- Return the short URL immediately so users can copy it

### Redirect API

```
GET /{shortUrl}
Response: 301 Moved Permanently
Location: https://example.com/very/long/url
```

**Why 301 instead of 302?** 
- 301 (Permanent Redirect): Search engines transfer SEO value to the original URL
- 302 (Temporary Redirect): Search engines keep the short URL in their index
- For URL shorteners, 301 is usually better—we want the original URL to get the SEO benefit

**Why GET?** Redirects are idempotent—same request, same result. GET is the right HTTP method.

## Step 4: Database Design

Now we need to store the mapping between short URLs and long URLs. Let&apos;s think about our options.

### What Data Do We Need?

- Short URL (primary key)
- Long URL (what we redirect to)
- Created timestamp (for analytics, expiration)
- Expiration date (optional)
- User ID (if we have user accounts)
- Click count (for analytics)

### Option 1: Relational Database (SQL)

```sql
CREATE TABLE urls (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    short_url VARCHAR(7) UNIQUE NOT NULL,
    long_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMP NULL,
    user_id BIGINT NULL,
    click_count BIGINT DEFAULT 0,
    INDEX idx_short_url (short_url),
    INDEX idx_expiration (expiration_date)
);
```

**Pros:**
- ACID guarantees (consistency)
- Easy to query (find expired URLs, user&apos;s URLs)
- Well-understood technology
- Good for complex queries

**Cons:**
- Harder to scale horizontally
- Can become a bottleneck at high write rates
- Joins can be slow at scale

**When to use:** If we need strong consistency and complex queries, SQL is good. But for 350K reads/second, we&apos;ll need heavy caching anyway.

### Option 2: NoSQL (Document Store)

```json
{
  "shortUrl": "abc123",
  "longUrl": "https://example.com/very/long/url",
  "createdAt": "2024-01-15T10:00:00Z",
  "expirationDate": "2024-12-31T23:59:59Z",
  "userId": "user123",
  "clickCount": 0
}
```

**Pros:**
- Easier to scale horizontally
- Better performance for simple key-value lookups
- Flexible schema (easy to add fields)
- Can handle high read/write loads

**Cons:**
- Weaker consistency guarantees
- Harder to do complex queries
- Need to handle eventual consistency

**When to use:** For a URL shortener, most operations are simple lookups by short URL. NoSQL fits well here.

### Our Decision: Start with SQL, Plan for NoSQL

**Reasoning:**
- Initially, SQL is simpler and provides strong guarantees
- We can migrate to NoSQL later if we hit scale issues
- Most URL shorteners start simple and evolve

**Key insight:** We&apos;ll cache aggressively anyway, so database choice matters less for reads. For writes, SQL auto-increment can work initially.

## Step 5: Generating Short URLs

This is one of the most interesting parts. How do we generate short, unique URLs?

### Requirements for Short URLs

1. **Short**: 6-8 characters (shorter is better for sharing)
2. **Unique**: No collisions
3. **Readable**: Avoid confusing characters (0/O, 1/l/I)
4. **Fast to generate**: Can&apos;t be a bottleneck

### Character Set: Base62

We&apos;ll use Base62 encoding: `a-z`, `A-Z`, `0-9` (62 characters total).

**Why Base62?**
- More characters than Base36 (0-9, a-z) = shorter URLs
- Fewer characters than Base64 (which includes +, /, =)
- URL-safe (no special characters)
- Human-readable

**How many characters do we need?**

- 6 characters: 62^6 = 56.8 billion combinations
- 7 characters: 62^7 = 3.5 trillion combinations
- 8 characters: 62^8 = 218 trillion combinations

For 100M URLs with room to grow, **7 characters** is perfect. We get 3.5 trillion combinations—enough for centuries of growth.

### Approach 1: Hash-Based Generation

```python
import hashlib
import base62

def generate_short_url(long_url):
    # Add timestamp to ensure uniqueness
    hash_input = long_url + str(time.time())
    hash_value = hashlib.md5(hash_input.encode()).hexdigest()
    # Take first 7 characters
    short_url = base62.encode(int(hash_value[:7], 16))
    return short_url[:7]
```

**Pros:**
- Deterministic (same URL + timestamp = same short URL)
- No need for a counter service
- Can generate offline

**Cons:**
- **Collisions possible**: Even with 3.5T combinations, hash collisions can happen
- **Need to check uniqueness**: Must query database to verify
- **Retry logic**: If collision, regenerate (could be slow)
- **Not sequential**: Can&apos;t predict next URL

**When collisions happen:**
- Two different long URLs might hash to the same short URL
- We&apos;d need to detect this and retry
- At scale, this becomes a problem

### Approach 2: Counter-Based Generation (Better)

Instead of hashing, use a counter that generates unique IDs, then encode them.

```python
import base62

def generate_short_url(counter_id):
    # Counter gives us: 1, 2, 3, 4, ...
    # Encode to Base62: a, b, c, d, ...
    return base62.encode(counter_id)[:7]
```

**Pros:**
- **Guaranteed uniqueness**: Counter ensures no collisions
- **No database lookup needed**: Just increment counter
- **Predictable**: Can pre-generate URLs
- **Simple**: Easy to understand and debug

**Cons:**
- **Single point of failure**: Counter service must be highly available
- **Sequential**: URLs are predictable (security consideration)
- **Needs coordination**: In distributed system, need to coordinate counters

**Why we choose this:** For a URL shortener, uniqueness is critical. Counter-based approach guarantees uniqueness and is simpler to reason about.

### Implementing the Counter Service

We need a service that generates unique, sequential IDs. Here are options:

#### Option A: Database Auto-Increment

```sql
CREATE TABLE counter (
    id BIGINT AUTO_INCREMENT PRIMARY KEY
);

-- Get next ID
INSERT INTO counter () VALUES ();
SELECT LAST_INSERT_ID();
```

**Pros:**
- Simple
- Built into most databases
- ACID guarantees

**Cons:**
- **Single bottleneck**: All writes go through one database
- **Hard to scale**: Can&apos;t easily distribute
- **Latency**: Database round-trip for every URL

**When to use:** Good for MVP, but won&apos;t scale to thousands of writes/second.

#### Option B: Range-Based Allocation

Pre-allocate ranges to different servers:

```
Server 1: IDs 1 - 1,000,000
Server 2: IDs 1,000,001 - 2,000,000
Server 3: IDs 2,000,001 - 3,000,000
...
```

Each server maintains its own counter within its range.

**Pros:**
- **Distributed**: Multiple servers can generate IDs
- **No coordination needed**: Each server works independently
- **Scalable**: Add more servers = more capacity

**Cons:**
- **Wasted IDs**: If server 1 runs out, we can&apos;t use its range
- **Management overhead**: Need to track and allocate ranges
- **Uneven distribution**: Some servers might exhaust ranges faster

**How to implement:**
- Use Zookeeper/etcd to coordinate range allocation
- When a server starts, it requests a range
- Server tracks its current counter locally
- When range exhausted, request new range

#### Option C: Twitter Snowflake-Style

Generate IDs with timestamp + machine ID + sequence:

```
64-bit ID:
- 41 bits: Timestamp (milliseconds)
- 10 bits: Machine ID
- 12 bits: Sequence number
```

**Pros:**
- **Distributed**: No coordination needed
- **Time-ordered**: IDs are roughly chronological
- **Scalable**: Can generate millions per second per machine

**Cons:**
- **More complex**: Need to manage machine IDs
- **Clock dependency**: Requires synchronized clocks
- **Longer IDs**: Might need more than 7 characters

**When to use:** For very high scale, this is excellent. But for URL shorteners, range-based is simpler.

### Our Decision: Range-Based Counter Service

**Reasoning:**
- Start with database auto-increment for simplicity
- When we hit scale limits, migrate to range-based allocation
- Use Zookeeper/etcd for coordination
- Each API server gets a range and maintains local counter

**Implementation sketch:**

```python
class CounterService:
    def __init__(self):
        self.current_id = self.get_range_from_coordinator()
        self.max_id = self.current_id + RANGE_SIZE
        
    def get_next_id(self):
        if self.current_id >= self.max_id:
            self.current_id = self.get_new_range()
        id = self.current_id
        self.current_id += 1
        return id
```

## Step 6: High-Level Architecture

Now let&apos;s put it all together. Here&apos;s our high-level design:

```
┌─────────┐
│ Clients │ (Web, Mobile, API)
└────┬────┘
     │
     ▼
┌─────────────────┐
│  Load Balancer  │ (Distribute traffic)
└────┬────────────┘
     │
     ▼
┌─────────────────┐      ┌──────────────┐
│  API Servers    │◄────►│   Cache      │
│  (Stateless)    │      │   (Redis)    │
│  - Shorten      │      │              │
│  - Redirect     │      └──────────────┘
└────┬────────────┘
     │
     ▼
┌─────────────────┐      ┌──────────────┐
│   Database      │◄────►│   Counter    │
│   (Sharded)     │      │   Service    │
└─────────────────┘      └──────────────┘
```

### Component Breakdown

**Load Balancer:**
- Distributes incoming requests across API servers
- Health checks to remove unhealthy servers
- SSL termination

**API Servers (Stateless):**
- Handle shorten and redirect requests
- Stateless = easy to scale horizontally
- Can add/remove servers without coordination

**Cache (Redis):**
- Stores short URL → long URL mappings
- Reduces database load dramatically
- Fast lookups (< 1ms)

**Database:**
- Persistent storage for all URL mappings
- Sharded for scalability
- Read replicas for read scaling

**Counter Service:**
- Generates unique IDs
- Range-based allocation
- Highly available

## Step 7: URL Shortening Flow

Let&apos;s trace through what happens when someone shortens a URL:

```
1. Client sends POST /api/v1/shorten with long URL
2. Load balancer routes to available API server
3. API server validates long URL (format, length, blacklist)
4. If custom alias provided:
   a. Check if alias exists in database
   b. If exists and belongs to different user → reject
   c. If exists and belongs to same user → allow update
5. If no custom alias:
   a. Get next ID from counter service
   b. Encode ID to Base62 (7 characters)
6. Store mapping in database:
   - short_url → long_url
   - expiration_date
   - user_id
   - created_at
7. Cache the mapping in Redis (for fast redirects)
8. Return short URL to client
```

**Why cache immediately?** The next request for this URL will likely come soon (user testing, sharing). Caching immediately improves redirect performance.

**Error handling:**
- If counter service unavailable → return 503 (Service Unavailable)
- If database write fails → retry with exponential backoff
- If custom alias collision → return 409 (Conflict)

## Step 8: URL Redirection Flow

This is the hot path—most requests are redirects. It must be fast:

```
1. Client requests GET /abc123
2. Load balancer routes to API server
3. API server checks Redis cache:
   a. Cache hit → return 301 redirect immediately (< 1ms)
   b. Cache miss → continue to step 4
4. Query database for short URL:
   a. Determine shard from short URL hash
   b. Query that shard
5. If found in database:
   a. Check expiration (if expired, return 410 Gone)
   b. Cache in Redis (with TTL matching expiration)
   c. Increment click count (async, don&apos;t block redirect)
   d. Return 301 redirect
6. If not found → return 404
```

**Why check expiration on redirect?** Users might access expired URLs. We check here to avoid redirecting to invalid URLs.

**Why async click count?** Click counting is nice-to-have analytics. Don&apos;t slow down redirects for it. Use async job queue.

**Performance targets:**
- Cache hit: < 1ms (Redis lookup)
- Cache miss: < 10ms (database query + cache write)
- Total redirect: < 100ms (including network)

## Step 9: Database Sharding

With 100M URLs, we can&apos;t store everything in one database. We need to shard.

### Sharding Strategy: Hash-Based

Hash the short URL to determine which shard:

```python
def get_shard(short_url):
    hash_value = hash(short_url)
    shard_id = hash_value % NUM_SHARDS
    return f"shard_{shard_id}"
```

**Example:**
- `abc123` → hash = 12345 → shard = 12345 % 10 = 5 → `shard_5`
- `xyz789` → hash = 98765 → shard = 98765 % 10 = 5 → `shard_5`

**Pros:**
- **Even distribution**: Hash function distributes URLs evenly
- **No hotspots**: Popular URLs spread across shards
- **Simple**: Easy to implement

**Cons:**
- **Resharding is hard**: Adding shards requires rehashing everything
- **Can&apos;t query across shards**: Need short URL to find shard

**Why this works for URL shorteners:** We always have the short URL, so we can always determine the shard. No cross-shard queries needed.

### Sharding Strategy: Range-Based

Shard by first character of short URL:

```
Shard 1: a-g
Shard 2: h-n
Shard 3: o-u
Shard 4: v-z
Shard 5: A-G
Shard 6: H-N
Shard 7: O-U
Shard 8: V-Z
Shard 9: 0-3
Shard 10: 4-9
```

**Pros:**
- **Easy to understand**: Clear mapping
- **Easy to add shards**: Split a range

**Cons:**
- **Uneven distribution**: Some characters more common than others
- **Hotspots possible**: If many URLs start with &apos;a&apos;, Shard 1 gets overloaded

**Why we don&apos;t use this:** Hash-based is simpler and distributes better.

### Number of Shards

**Calculation:**
- 100M URLs
- Each shard can handle ~10M URLs comfortably
- **Need: 10 shards minimum**

**But consider:**
- Growth: Plan for 10x growth = 1B URLs
- **Start with 10 shards, can add more later**

**Resharding strategy:**
- Use consistent hashing (ring-based)
- When adding shard, only move ~10% of data
- Use dual-write during migration (write to old and new shard)

## Step 10: Caching Strategy

Caching is critical for performance. Let&apos;s think through our strategy.

### Cache-Aside Pattern

This is what we&apos;ll use:

```
1. Check cache for short URL
2. If cache hit → return long URL
3. If cache miss → query database
4. Store result in cache
5. Return long URL
```

**Why cache-aside?**
- Simple to understand
- Cache failures don&apos;t break system (fallback to database)
- Easy to invalidate (just delete from cache)

**Alternative: Write-Through**
- Write to cache and database simultaneously
- More complex, but ensures cache is always fresh

**Why we don&apos;t use write-through:** URL mappings rarely change. Cache-aside is simpler and sufficient.

### Cache Size Calculation

**Assumptions:**
- 20% of URLs get 80% of traffic (Pareto principle)
- Cache the top 20% = 20M URLs
- Each entry: short URL (7 bytes) + long URL (500 bytes) + metadata (50 bytes) ≈ 557 bytes

**Cache size needed:**
- 20M × 557 bytes = ~11 GB

**Redis memory:**
- Redis overhead: ~100 bytes per key
- Total: 20M × (557 + 100) = ~13 GB

**Why 20%?** This covers most traffic. Cache hit rate will be ~80%, which is excellent.

### Cache Eviction Policy

**LRU (Least Recently Used):**
- When cache is full, evict least recently used entries
- Keeps popular URLs in cache
- Simple and effective

**TTL (Time To Live):**
- Set TTL matching URL expiration
- Expired URLs automatically removed
- Reduces memory usage

**Our strategy:** Use both—LRU for eviction, TTL for expiration.

### Cache Invalidation

**When to invalidate:**
- URL deleted
- URL expiration changed
- URL updated (rare)

**How to invalidate:**
- Delete key from Redis
- Or set TTL to 0

**Challenge:** In distributed system, need to invalidate across all cache servers.

**Solution:** Use Redis pub/sub to broadcast invalidation messages.

## Step 11: Handling Edge Cases

Let&apos;s think about edge cases and how to handle them.

### Custom Alias Collisions

**Problem:** User wants `short.ly/mybrand`, but it&apos;s taken.

**Solution:**
- Check database for existing alias
- If exists and belongs to different user → reject with 409 Conflict
- If exists and belongs to same user → allow update (user owns it)
- If doesn&apos;t exist → create it

**Why allow same-user updates?** Users might want to change where their custom alias points.

### URL Expiration

**Problem:** URLs should expire, but users might access them after expiration.

**Solution:**
- Store expiration date in database
- On redirect, check expiration before redirecting
- If expired → return 410 Gone (not 404, because URL existed)
- Background job periodically deletes expired URLs

**Why 410 Gone?** 404 means &quot;never existed&quot;, 410 means &quot;existed but removed&quot;. More accurate.

### Malicious URLs

**Problem:** Users might shorten malicious/phishing URLs.

**Solution:**
- Maintain blacklist of malicious domains
- Check against blacklist before shortening
- Reject with 400 Bad Request if blacklisted
- Optionally: Check against external threat intelligence APIs

**Why important?** URL shorteners are often used for phishing. We have a responsibility to prevent abuse.

### Rate Limiting

**Problem:** Users might abuse the service (spam, DoS).

**Solution:**
- Limit requests per IP: 100 requests/minute
- Limit requests per user: 1000 requests/hour (if authenticated)
- Use token bucket algorithm
- Return 429 Too Many Requests when limit exceeded

**Why rate limit?** Prevents abuse and ensures fair usage.

### Hot URLs

**Problem:** Some URLs go viral and get millions of clicks.

**Solution:**
- Cache popular URLs longer (extend TTL)
- Use CDN for top 1% of URLs
- Separate &quot;hot cache&quot; tier for very popular URLs
- Monitor and auto-promote hot URLs to CDN

**Why special handling?** Hot URLs can overwhelm a single cache server. Distribute across CDN.

## Step 12: Scaling for Growth

As we grow, we&apos;ll hit new bottlenecks. Let&apos;s plan ahead.

### Read Scaling

**Current:** 350K RPS reads

**Bottlenecks:**
- Single cache server
- Database read capacity

**Solutions:**
- **Redis Cluster**: Distribute cache across multiple nodes
- **Read Replicas**: Multiple database replicas for reads
- **CDN**: Cache redirects at edge (geographic distribution)
- **Connection Pooling**: Reuse database connections

**When to implement:**
- Redis Cluster: When single Redis hits memory limit
- Read Replicas: When database CPU hits 70%
- CDN: When geographic latency becomes issue

### Write Scaling

**Current:** ~2 RPS writes

**Bottlenecks:**
- Counter service
- Database write capacity

**Solutions:**
- **Counter Service Sharding**: Multiple counter services with ranges
- **Database Sharding**: Already planned
- **Write-Ahead Log**: Batch writes for better throughput
- **Async Writes**: Write to queue, process async (for non-critical data)

**When to implement:**
- Counter sharding: When counter service becomes bottleneck
- Async writes: For analytics, click counting (non-critical)

### Storage Scaling

**Current:** 55 GB

**Future:** 1B URLs = 550 GB, 10B URLs = 5.5 TB

**Solutions:**
- **Database Sharding**: Already planned
- **Archival**: Move old URLs to cold storage (S3, Glacier)
- **Compression**: Compress long URLs in storage
- **Deduplication**: If same URL shortened multiple times, store once

**When to implement:**
- Archival: When database size becomes concern
- Compression: When storage costs become issue

## Step 13: Monitoring and Analytics

We need visibility into our system.

### Key Metrics

**Performance:**
- Redirect latency (p50, p95, p99)
- Cache hit rate (target: >80%)
- Database query latency
- Error rate (4xx, 5xx)

**Business:**
- URLs created per day
- Clicks per day
- Popular URLs (top 100)
- User growth

**Infrastructure:**
- CPU, memory, disk usage
- Network bandwidth
- Cache memory usage
- Database connection pool usage

### Click Analytics

Users want to know:
- How many clicks did my URL get?
- Where did clicks come from? (geographic)
- What devices/browsers?
- What referrers?

**Implementation:**
- Store click events in separate analytics database
- Use async job queue (don&apos;t block redirects)
- Aggregate data for dashboards
- Consider using time-series database (InfluxDB, TimescaleDB)

**Why separate database?** Analytics queries are different from URL lookups. Separate database optimized for analytics.

## Step 14: Security Considerations

Security is critical for a public-facing service.

### Authentication & Authorization

**For custom aliases:**
- Require user accounts
- Authenticate via API keys or OAuth
- Users can only update/delete their own URLs

**For public URLs:**
- No authentication needed (ease of use)
- But rate limit by IP to prevent abuse

### Input Validation

**Validate long URLs:**
- Check URL format (must start with http:// or https://)
- Check URL length (max 2048 characters)
- Check against blacklist
- Sanitize to prevent injection attacks

**Validate custom aliases:**
- Alphanumeric + hyphens only
- Length limits (min 4, max 20 characters)
- Reserved words (admin, api, etc.)

### Privacy

**Consider:**
- Allow users to make URLs private (password-protected)
- Don&apos;t log sensitive data
- GDPR compliance (allow URL deletion)
- Rate limit to prevent enumeration attacks

## Step 15: Trade-offs and Alternatives

Let&apos;s reflect on the decisions we made and alternatives.

### Counter Service vs Hash-Based

**We chose:** Counter-based

**Trade-off:**
- Counter: Guaranteed uniqueness, but needs coordination
- Hash: No coordination, but collisions possible

**Why counter:** Uniqueness is critical. Collisions would break the system.

### SQL vs NoSQL

**We chose:** Start with SQL, migrate to NoSQL if needed

**Trade-off:**
- SQL: Strong consistency, complex queries, harder to scale
- NoSQL: Eventual consistency, simple queries, easier to scale

**Why SQL initially:** Simpler to start, strong guarantees. Can migrate later.

### Cache Size

**We chose:** Cache top 20% (20M URLs)

**Trade-off:**
- More cache = faster reads, but higher cost
- Less cache = lower cost, but slower reads

**Why 20%:** 80% cache hit rate is excellent. Diminishing returns beyond that.

### Sharding Strategy

**We chose:** Hash-based sharding

**Trade-off:**
- Hash-based: Even distribution, but hard to reshard
- Range-based: Easy to reshard, but uneven distribution

**Why hash-based:** Even distribution is more important than easy resharding.

## Summary

Designing a URL shortener requires careful consideration of:

1. **Unique ID Generation**: Counter service with Base62 encoding ensures uniqueness
2. **Scalable Storage**: Sharded database handles growth
3. **Fast Reads**: Multi-layer caching (Redis + CDN) for performance
4. **High Availability**: Load balancing, replication, redundancy
5. **Monitoring**: Analytics and observability for operations

**Key insights:**
- Read-heavy workload → optimize for reads (caching, CDN)
- Simple data model → NoSQL might be overkill initially
- Uniqueness critical → Counter-based generation
- Scale gradually → Start simple, add complexity as needed

**Next steps:**
- Implement MVP with SQL + Redis
- Monitor performance and scale
- Migrate to NoSQL if database becomes bottleneck
- Add CDN when geographic distribution matters

The key is balancing simplicity with scalability. Start with a simple design, measure everything, and optimize based on actual requirements and constraints.
