---
title: "Capacity Estimation"
date: "2024-01-20"
description: "Master back-of-the-envelope calculations: powers of 2, latency numbers, QPS math, and storage estimation for system design interviews"
tags: ["System Design", "Capacity Planning", "Math"]
---

## Why It Matters

Capacity estimation is one of the first things an interviewer tests. Before designing any system, you need to know the *scale* you're designing for. A system handling 1,000 requests/day looks completely different from one handling 10 million. Getting this wrong early means your entire architecture is built on faulty assumptions.

The good news: you don't need precision. You need **order-of-magnitude accuracy** and a systematic approach.

---

## Core Reference Numbers

Memorize these. They come up constantly.

### Powers of 2

| Power | Exact | Approximate | Common Name |
|-------|-------|-------------|-------------|
| 2^10 | 1,024 | ~1 thousand | 1 KB |
| 2^20 | 1,048,576 | ~1 million | 1 MB |
| 2^30 | 1,073,741,824 | ~1 billion | 1 GB |
| 2^40 | ~1 trillion | ~1 trillion | 1 TB |
| 2^50 | ~1 quadrillion | ~1 quadrillion | 1 PB |

### Latency Numbers (2024 ballpark)

| Operation | Latency |
|-----------|---------|
| L1 cache read | ~1 ns |
| L2 cache read | ~10 ns |
| RAM read | ~100 ns |
| SSD random read | ~100 µs |
| HDD random read | ~10 ms |
| Same datacenter round-trip | ~0.5 ms |
| US cross-country round-trip | ~40 ms |
| Transatlantic round-trip | ~150 ms |

**Key insight**: Memory is 100x faster than SSD. SSD is 100x faster than HDD. Use this to justify caching decisions.

### Useful Approximations

- 1 billion nanoseconds = 1 second
- 1 million microseconds = 1 second
- 1 day ≈ 86,400 seconds ≈ **100,000 seconds** (use 10^5 for quick math)
- 1 month ≈ 2.5 million seconds ≈ **3 × 10^6**
- 1 year ≈ 31.5 million seconds ≈ **3 × 10^7**

---

## The Estimation Framework

### Step 1: Clarify Scale

Always ask:
- How many daily active users (DAU)?
- Read-heavy or write-heavy?
- What's the data size per request?

### Step 2: Calculate QPS

```
QPS = DAU × average_requests_per_user_per_day / seconds_per_day

Peak QPS ≈ 2–3× average QPS
```

**Example — Twitter-scale**:
- 300M DAU, each user views 100 tweets/day
- Read QPS = 300M × 100 / 100,000 = **300,000 read QPS**
- If 1% are writes: **3,000 write QPS**

### Step 3: Calculate Storage

```
Storage per day = write_QPS × seconds_per_day × data_size_per_write
Storage per year = daily × 365
```

**Example — tweet storage**:
- 3,000 write QPS × 100,000 sec/day = 300M tweets/day
- Each tweet: ~200 bytes text + ~500 bytes metadata = 700 bytes
- Daily storage: 300M × 700 bytes ≈ **210 GB/day**
- Annual: ~75 TB

### Step 4: Calculate Bandwidth

```
Bandwidth = QPS × average_response_size
```

**Example**:
- 300,000 read QPS × 1 KB per tweet = **300 GB/s read bandwidth**

---

## Worked Examples

### URL Shortener

Given: 100M new URLs/day, 10:1 read:write ratio

| Metric | Calculation | Result |
|--------|-------------|--------|
| Write QPS | 100M / 100,000 | **1,000 QPS** |
| Read QPS | 1,000 × 10 | **10,000 QPS** |
| URL size | ~500 bytes | — |
| Daily storage | 100M × 500B | **50 GB/day** |
| 5-year storage | 50 × 365 × 5 | **~90 TB** |

### Instagram-like Photo Service

Given: 1B DAU, users upload 50M photos/day, 500:1 read:write

| Metric | Calculation | Result |
|--------|-------------|--------|
| Write QPS | 50M / 100,000 | **500 QPS** |
| Read QPS | 500 × 500 | **250,000 QPS** |
| Photo size | ~2 MB avg | — |
| Daily storage | 50M × 2 MB | **100 TB/day** |

---

## Storage Size Cheat Sheet

| Data Type | Typical Size |
|-----------|-------------|
| UUID/ID | 36 bytes (string), 16 bytes (binary) |
| URL | ~100 bytes |
| Tweet/short text | ~200 bytes |
| User profile | ~1 KB |
| Thumbnail image | ~10–50 KB |
| Full image | ~1–5 MB |
| 1-min video (compressed) | ~10–50 MB |
| 1-hr video (HD) | ~1–2 GB |

---

## Interview Tips

**Do this out loud**: Walk through every step verbally. Interviewers want to see your reasoning, not just the final number.

**Round aggressively**: Use 10^5 for "seconds per day", not 86,400. Say "I'll round to keep the math clean."

**State your assumptions**: "I'm assuming average tweet is 200 bytes. In practice it could vary." This shows maturity.

**Check your answers**: Does 300 GB/s bandwidth seem insane? It should trigger you to question your assumptions or consider CDN offloading.

**Common mistake**: Forgetting replication. If you need 3× replication for durability, your storage estimate multiplies by 3.
