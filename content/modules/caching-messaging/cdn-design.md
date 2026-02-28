---
title: "CDN Design & Content Delivery"
date: "2024-02-19"
description: "How CDNs work, edge servers, push vs pull CDN, cache headers, CDN invalidation, and when to use a CDN in your system design"
tags: ["System Design", "CDN", "Performance", "Networking"]
---

## Why It Matters

A CDN can reduce page load times from 3 seconds to 300ms and offload 90% of your origin server traffic. For globally distributed systems, CDNs are non-negotiable. Understanding how they work lets you design systems that are fast everywhere in the world.

---

## What Is a CDN?

A Content Delivery Network is a globally distributed network of servers (edge servers or PoPs — Points of Presence) that cache content close to users.

```
Without CDN:
  User (Tokyo) → Origin server (US-East) → 200ms roundtrip

With CDN:
  User (Tokyo) → CDN edge (Tokyo) → 5ms roundtrip (if cached)
             OR  CDN edge → Origin → cache → User (first request only)
```

**CDN providers**: Cloudflare, AWS CloudFront, Fastly, Akamai, Google Cloud CDN

---

## What CDNs Serve

**Cacheable (good for CDN)**:
- Static assets: JS, CSS, images, fonts
- Videos and audio files
- Software downloads
- API responses (with proper cache headers)
- HTML pages (for mostly-static sites)

**Not cacheable (bypass CDN)**:
- Real-time API responses unique per user
- Private user data
- WebSocket connections
- Non-idempotent requests (POST, PUT, DELETE)

---

## Pull CDN vs Push CDN

### Pull CDN (Origin Pull)

Content is fetched from origin on the **first request** to the CDN edge.

```
1. User requests cdn.example.com/image.jpg from Tokyo edge
2. Edge doesn't have it (cache miss)
3. Edge fetches from origin server
4. Edge caches the response
5. Subsequent requests served from edge cache
```

**Pros**: Zero maintenance — just update origin, CDN pulls new content automatically
**Cons**: First user pays the origin round-trip latency (cold start penalty)

**Used by**: CloudFront, Cloudflare, most modern CDNs
**Best for**: Dynamic content that changes frequently; large catalogs with unpredictable access patterns

### Push CDN

Content is **proactively uploaded** to CDN edge servers before users request it.

```
1. Publisher uploads new video to CDN control plane
2. CDN distributes file to all (or selected) edge nodes
3. All users served from edge immediately (no cold start)
```

**Pros**: No cold start, predictable performance
**Cons**: Must manage uploads explicitly; storage space used at all edges even if content is never requested

**Used by**: Video streaming (Netflix pre-positions popular titles at edges)
**Best for**: High-traffic content you know users will request (new releases, major events)

---

## Cache Headers

HTTP cache headers control how CDNs and browsers cache responses.

### Cache-Control

```http
Cache-Control: public, max-age=31536000, immutable
```

| Directive | Meaning |
|-----------|---------|
| `public` | Response can be cached by CDN and browser |
| `private` | Response for this user only — no CDN caching |
| `no-cache` | Must revalidate with origin before serving (can still cache) |
| `no-store` | Never cache, always fresh from origin |
| `max-age=N` | Cache for N seconds |
| `s-maxage=N` | CDN-specific max-age (overrides max-age for shared caches) |
| `immutable` | Content will never change — browser won't even check for updates |

### ETag and Last-Modified (Conditional Requests)

When `max-age` expires, CDN can revalidate without re-downloading:

```http
# CDN sends: "Do you have anything newer than this?"
If-None-Match: "abc123"   (ETag value)
If-Modified-Since: Thu, 01 Jan 2024 00:00:00 GMT

# Origin responds: "Nope, still fresh"
HTTP/1.1 304 Not Modified   (no body, CDN keeps its cached copy)
```

This saves bandwidth when content hasn't changed.

### Practical Cache Header Strategy

```
Static assets (hashed filenames like bundle.a1b2c3.js):
  Cache-Control: public, max-age=31536000, immutable
  → Cache forever — hash changes when content changes

HTML files (index.html):
  Cache-Control: no-cache
  → Always revalidate — HTML references versioned assets

API responses:
  Cache-Control: public, s-maxage=60, max-age=0
  → CDN caches for 60s, browser always revalidates

Private user data:
  Cache-Control: private, no-store
  → Never cache
```

---

## CDN Invalidation

When content changes, you need to bust the CDN cache.

### URL-Based Cache Busting (Preferred)

Change the URL when content changes. No invalidation needed — the old URL stays cached, new URL populates fresh.

```
Old: /assets/main.js      → /assets/main.a1b2c3.js
New: /assets/main.js      → /assets/main.d4e5f6.js
```

Modern build tools (webpack, Vite) do this automatically via content hashing.

### Explicit Invalidation API

CDNs provide APIs to invalidate specific paths:

```bash
# CloudFront
aws cloudfront create-invalidation --distribution-id ABCDEF \
  --paths "/api/products/*" "/api/categories"

# Cloudflare Cache Purge API
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE/purge_cache" \
  -d '{"files": ["https://example.com/image.jpg"]}'
```

**Limitation**: Invalidation propagates to all edge nodes (can take 30–60 seconds). Invalidation requests may be rate-limited or cost money.

### Surrogate Keys / Cache Tags

Advanced CDNs (Fastly, Cloudflare Enterprise) support tagging cache entries with multiple keys, then invalidating by tag.

```
# Responses tagged:
X-Cache-Tag: product:123, category:shoes, brand:nike

# Invalidate all cached responses related to product 123:
Purge: product:123
```

---

## CDN for Video Streaming

Video CDNs add:
- **Chunked video (HLS/DASH)**: Video split into 2–10 second segments; each segment is a CDN-cacheable URL
- **Byte-range requests**: Resume from middle of large files
- **Dynamic Adaptive Bitrate**: CDN serves different quality chunks based on user bandwidth
- **Pre-positioning**: Netflix distributes popular content to ISP-level edge nodes overnight

---

## Interview Tips

**Always mention CDN for images and static assets**: "All static assets — JS, CSS, images — would be served through a CDN like CloudFront, which reduces load on origin servers and cuts latency globally."

**Pull CDN is the default**: Unless you're building a video platform or have a specific pre-warming requirement, pull CDN is simpler.

**Cache-Control is key**: "I'd set `max-age=31536000, immutable` for hashed assets and `no-cache` for HTML to ensure users always get fresh content references."

**CDN reduces origin load dramatically**: "With a CDN, ~95% of requests for static content never hit our origin servers. This means we need far fewer origin servers and the bill is much lower."

**Security with CDNs**: "The CDN can also terminate TLS, absorb DDoS attacks (Cloudflare's network absorbs terabits per second), and enforce geo-blocking."
