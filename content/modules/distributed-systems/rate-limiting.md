---
title: "Rate Limiting"
date: "2024-03-07"
description: "Token bucket, leaky bucket, fixed window, and sliding window algorithms — and how to implement distributed rate limiting with Redis"
tags: ["System Design", "Rate Limiting", "Redis", "API Design"]
---

## Why It Matters

Rate limiting protects your system from abuse, prevents resource exhaustion, and ensures fair usage across users. Every public API at scale — Stripe, GitHub, Twitter — uses rate limiting. It's a common system design interview question, and the distributed version has interesting challenges.

---

## Why Rate Limit?

- **Prevent abuse**: Malicious users sending millions of requests
- **Prevent DoS**: Accidental or intentional traffic spikes
- **Fair usage**: Prevent one user from consuming all resources
- **Cost control**: API calls to expensive downstream services (GPT, payment processors)
- **SLA enforcement**: Different limits for free vs paid tiers

---

## Rate Limiting Algorithms

### Fixed Window Counter

Divide time into fixed windows (e.g., 1-minute windows). Count requests per window.

```
Window: 10:00–10:01 → 45 requests
Window: 10:01–10:02 → 100 requests → LIMIT EXCEEDED
Window: 10:02–10:03 → 0 requests
```

**Implementation**:
```python
def is_allowed(user_id, limit=100):
    window = int(time.time() / 60)  # 1-minute windows
    key = f"rate:{user_id}:{window}"
    count = redis.incr(key)
    if count == 1:
        redis.expire(key, 60)  # Set TTL on first request
    return count <= limit
```

**Pros**: Simple, low memory (one counter per user per window)
**Cons**: **Boundary spike** — a user can make 100 requests at 10:00:59 and 100 more at 10:01:01, effectively 200 requests in 2 seconds

### Sliding Window Log

Store timestamp of every request. Count how many fall within the last window.

```python
def is_allowed(user_id, limit=100, window_sec=60):
    now = time.time()
    cutoff = now - window_sec
    key = f"rate_log:{user_id}"

    # Remove old entries
    redis.zremrangebyscore(key, 0, cutoff)

    # Add current request
    redis.zadd(key, {str(uuid4()): now})
    redis.expire(key, window_sec)

    # Count requests in window
    count = redis.zcard(key)
    return count <= limit
```

**Pros**: No boundary spike; accurate sliding window
**Cons**: High memory (store every request timestamp); not practical for high-traffic users

### Sliding Window Counter

Approximation: combine fixed windows with a rolling weighted average.

```python
def is_allowed(user_id, limit=100, window_sec=60):
    now = time.time()
    current_window = int(now / window_sec)
    prev_window = current_window - 1

    # Get counters for current and previous windows
    current_count = int(redis.get(f"rate:{user_id}:{current_window}") or 0)
    prev_count = int(redis.get(f"rate:{user_id}:{prev_window}") or 0)

    # Weight previous window based on elapsed time in current window
    elapsed = now % window_sec
    weight = 1 - (elapsed / window_sec)
    estimate = prev_count * weight + current_count

    if estimate >= limit:
        return False

    redis.incr(f"rate:{user_id}:{current_window}")
    return True
```

**Pros**: Low memory (only 2 counters), smooth approximation (error < 0.003% of limit)
**Used by**: Cloudflare, many production rate limiters

### Token Bucket

A bucket holds tokens (max capacity = burst limit). Tokens are added at a fixed rate. Each request consumes a token.

```
Token bucket:
  Capacity: 100 tokens
  Refill rate: 10 tokens/second
  Each request costs 1 token

If bucket has tokens: allow request, remove token
If bucket empty: reject request (or queue)
```

**Properties**:
- Allows **bursts** up to bucket capacity
- Smooth average rate (refill rate)
- If no requests for a while, bucket fills up → burst allowed

**Implementation** (using Redis):
```python
def token_bucket(user_id, capacity=100, refill_rate=10):
    key = f"bucket:{user_id}"
    now = time.time()

    # Lua script for atomicity
    script = """
    local tokens = tonumber(redis.call('GET', KEYS[1])) or tonumber(ARGV[1])
    local last_refill = tonumber(redis.call('GET', KEYS[2])) or tonumber(ARGV[3])
    local refill = (tonumber(ARGV[3]) - last_refill) * tonumber(ARGV[2])
    tokens = math.min(tokens + refill, tonumber(ARGV[1]))
    if tokens >= 1 then
        redis.call('SET', KEYS[1], tokens - 1)
        redis.call('SET', KEYS[2], ARGV[3])
        return 1
    else
        return 0
    end
    """
    allowed = redis.eval(script, 2, f"{key}:tokens", f"{key}:last",
                         capacity, refill_rate, now)
    return bool(allowed)
```

**Used by**: AWS API Gateway, Stripe, most API gateways

### Leaky Bucket

Requests enter a queue (bucket). Processed at a fixed output rate. If queue is full, requests are dropped.

```
Requests → [Queue: max N] → Process at constant rate
```

**Difference from Token Bucket**:
- Token bucket: allows bursts up to capacity
- Leaky bucket: smooths out bursts, constant output rate

**Used for**: Traffic shaping in networking (QoS), ensuring downstream services aren't overwhelmed

---

## Algorithm Comparison

| Algorithm | Memory | Burst | Accuracy | Use Case |
|-----------|--------|-------|----------|---------|
| Fixed Window | Low | Yes (at boundaries) | Medium | Simple limits, rough fairness |
| Sliding Log | High | No | Exact | Low-traffic APIs needing precision |
| Sliding Counter | Low | Slightly | ~99.7% | High-traffic production (Cloudflare) |
| Token Bucket | Low | Yes (controlled) | Exact | API rate limiting, allowing bursts |
| Leaky Bucket | Medium | No | Exact | Traffic shaping, constant rate |

---

## Distributed Rate Limiting

Single-server rate limiting is easy. The challenge is enforcing limits across multiple API server instances.

### Approach 1: Centralized Redis

All API servers share a Redis counter:

```python
# Every API server uses the SAME Redis instance
# Works correctly, but Redis is single point of failure
# And a bottleneck at very high scale
```

**Mitigation**: Redis Cluster for high availability; local approximate limiting as a first pass.

### Approach 2: Two-Layer Limiting

- **Local rate limiter**: Each API server has a local counter (e.g., 1/N of total limit)
- **Global rate limiter**: Periodic sync with Redis for global view

```
Global limit: 1000 req/min per user
3 API servers → each gets 333 req/min local limit
If local limit exceeded → check global Redis counter
```

**Trade-off**: Less accurate (can allow slightly over limit), but Redis is only hit when local limit is reached.

### Approach 3: Rate Limiting at the Gateway

Handle rate limiting in a dedicated gateway (NGINX, Kong, API Gateway) before requests reach application servers.

---

## Returning Rate Limit Info

Always return rate limit info in response headers:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1704067261

# When rate limited:
HTTP/1.1 429 Too Many Requests
Retry-After: 42
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067261
```

---

## Interview Tips

**Token bucket for API rate limiting**: "I'd implement a token bucket per user stored in Redis. Token bucket allows short bursts (important for normal usage patterns) while enforcing an average rate."

**Redis + Lua for atomicity**: "The check-and-decrement operation must be atomic. I'd use a Redis Lua script so the read-modify-write is atomic, avoiding race conditions."

**Multiple dimensions**: "I'd rate limit at multiple levels: per-user, per-IP, and per-API-key, with different limits for free and paid tiers."

**Sliding window counter for Cloudflare-scale**: "At very high traffic, storing per-request timestamps is impractical. The sliding window counter approximation gives ~99.7% accuracy with O(1) memory per user."
