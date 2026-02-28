---
title: "The System Design Interview Framework"
date: "2024-01-28"
description: "A step-by-step framework for system design interviews: requirements, estimation, high-level design, deep dive, and trade-offs discussion"
tags: ["System Design", "Interview", "Framework"]
---

## Why You Need a Framework

System design interviews are open-ended by design. Without a structured approach, you'll either go too deep on one component and run out of time, or stay too shallow and not demonstrate architectural thinking.

A framework isn't a rigid script — it's a skeleton that keeps you organized and ensures you cover the right areas. The best engineers treat it as a conversation guide, not a checklist.

---

## The 4-Phase Framework

### Phase 1: Requirements Clarification (5 minutes)

Never start designing before understanding what you're building. Divide requirements into two types:

**Functional requirements** — what the system does:
- "Users can post tweets of up to 280 characters"
- "Users can follow other users"
- "Users can see a timeline of posts from people they follow"

**Non-functional requirements** — how the system behaves:
- Scale: DAU, QPS, data volume
- Consistency needs: Can we show slightly stale data?
- Availability: Five 9s? Or is some downtime OK?
- Latency: p99 < 100ms for reads? p50 < 10ms?
- Durability: Is data loss acceptable?

**Questions to always ask**:
1. What is the expected scale (users, requests/sec)?
2. Is this read-heavy or write-heavy?
3. What latency is acceptable?
4. Do we need global distribution?
5. What's out of scope? (Authentication? Analytics? Admin tools?)

**Pro tip**: Write requirements on the whiteboard. The interviewer can correct or add to them. This shows collaborative thinking.

---

### Phase 2: Capacity Estimation (5 minutes)

Quick back-of-the-envelope math to understand the scale. Refer to the [Capacity Estimation guide](./capacity-estimation) for formulas.

Calculate:
- **QPS** (both average and peak)
- **Storage** (daily, total over 5 years)
- **Bandwidth** (read and write)
- **Servers needed** (rough estimate)

Write these numbers down. They'll inform every architecture decision that follows.

**Example numbers for a Twitter-scale system**:
- 300M DAU, 100M tweets/day
- Read QPS: 300K, Write QPS: 1.2K
- Storage: ~3 TB/year for tweets (text only)
- Bandwidth: ~300 GB/s (with media, much more)

---

### Phase 3: High-Level Design (10–15 minutes)

Draw a block diagram showing the major components. Start simple and iterate.

**Standard components to consider**:

```
Client → DNS → Load Balancer → API Servers → Cache → Database
                                    ↓
                             Message Queue → Workers
                                    ↓
                             Object Storage (media)
                             CDN (for static assets)
```

**Walk through a request flow**: "A user posts a tweet → hits the load balancer → routes to an API server → writes to the message queue → the write worker persists to the database and updates caches."

**Key design decisions to state explicitly**:
- What database(s)? (SQL, NoSQL, time-series, graph)
- Where do you cache? (Client, CDN, application layer, database layer)
- Synchronous or asynchronous processing?
- Any message queues for decoupling?

Don't over-engineer at this stage. The high-level should fit on one whiteboard.

---

### Phase 4: Deep Dive (15–20 minutes)

The interviewer will direct you to specific components. Common deep dive areas:

**Data Model & Schema Design**
```sql
-- Show your actual table structures
CREATE TABLE tweets (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  content VARCHAR(280),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (user_id, created_at DESC)
);
```

**Scaling Specific Components**

How do you scale the database?
- Read replicas for read-heavy traffic
- Sharding strategy (hash on user_id? range on created_at?)
- Caching hot data in Redis

How do you handle the "celebrity problem" (an account with 100M followers)?
- Hybrid fanout: push for normal users, pull for celebrities
- Pre-warm caches for high-follower accounts

**Handling Failure Scenarios**

What happens if:
- The cache server dies? (Cache miss, fallback to DB, cache stampede protection)
- The database primary fails? (Automatic failover to replica)
- A message queue message is processed twice? (Idempotency keys)

**Optimization for Non-Functional Requirements**

If low latency is critical:
- Where can you add caching?
- Can you pre-compute results?
- Can you denormalize data to avoid joins?

If high durability is critical:
- Replication factor?
- Synchronous vs asynchronous replication?
- Cross-region backup?

---

## Trade-offs Discussion

Great system design interviews always end with trade-offs. Be proactive about acknowledging what you're *not* solving.

**Example trade-off statements**:

> "I chose to fanout tweets on write rather than read. This means writes are slower and more expensive, but timeline reads are extremely fast — which is the right trade-off given Twitter's 100:1 read:write ratio."

> "I'm using eventual consistency for the timeline. Users might see a post up to 5 seconds late, but the system stays available under failures. For a social feed, this is acceptable."

> "This design uses 3 layers of caching: CDN for static assets, Redis for hot timelines, and in-process caches for user metadata. The trade-off is cache invalidation complexity — we'd need a solid invalidation strategy."

---

## Time Allocation

| Phase | Time |
|-------|------|
| Requirements clarification | 5 min |
| Capacity estimation | 5 min |
| High-level design | 15 min |
| Deep dive (1–2 components) | 15 min |
| Trade-offs, bottlenecks | 5 min |
| **Total** | **45 min** |

---

## Common Mistakes

**Starting to code or going too deep too early**: You'll run out of time before the interviewer sees the full picture.

**Never drawing a diagram**: System design is visual. If you're only talking, your interviewer can't follow along.

**Not mentioning failure handling**: Production systems fail. Acknowledging this (and how you handle it) separates senior from junior candidates.

**Choosing technology without justification**: Don't say "I'll use Kafka." Say "I'll use Kafka here because we need ordered, durable message delivery at high throughput, and we may want to replay events later."

**Ignoring the non-functional requirements you stated**: You said p99 < 100ms. Did your final design actually achieve that? If not, acknowledge it.

---

## Questions to Practice

Start with these canonical problems:

1. Design a URL shortener (focuses on key generation, DB schema, caching)
2. Design Twitter feed (fanout patterns, celebrity problem, caching)
3. Design WhatsApp/Chat (WebSockets, message delivery, offline handling)
4. Design a Rate Limiter (algorithms, distributed coordination)
5. Design Google Drive (file chunking, sync, conflict resolution)

For each, apply the framework: requirements → estimation → high-level → deep dive → trade-offs.
