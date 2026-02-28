---
title: "Networking Fundamentals for System Design"
date: "2024-01-26"
description: "TCP vs UDP, HTTP/1.1 vs HTTP/2 vs HTTP/3, WebSockets, SSE, long polling, DNS, and TLS — the network layer knowledge you need for system design interviews"
tags: ["System Design", "Networking", "HTTP", "WebSockets", "DNS"]
---

## Why It Matters

Networking choices directly impact latency, throughput, and real-time capability. When you choose between polling and WebSockets, or between HTTP/1.1 and HTTP/2, you're making architectural decisions with real performance implications. Interviewers expect you to know *why* you pick one over another.

---

## TCP vs UDP

| Property | TCP | UDP |
|----------|-----|-----|
| Connection | Connection-oriented (3-way handshake) | Connectionless |
| Reliability | Guaranteed delivery, ordering | Best-effort |
| Error correction | Retransmission | None built-in |
| Flow control | Yes (sliding window) | No |
| Latency | Higher (ACKs, handshake) | Lower |
| Use cases | HTTP, email, file transfer | Video streaming, gaming, DNS, VoIP |

**When to choose UDP**:
- Real-time video/audio calls (Zoom, Discord) — a lost packet is worse than a skipped frame
- Online gaming — stale position data is useless, speed matters
- DNS queries — small, fast, can retry if needed

**When TCP matters**: Any time data integrity is non-negotiable (file downloads, financial transactions, HTTP APIs).

---

## HTTP Evolution

### HTTP/1.1 — The Baseline

- Text-based protocol (headers in ASCII)
- **One request per TCP connection** (or keep-alive with 6 connections limit per browser)
- **Head-of-line blocking**: Requests must complete in order

**Problem**: Loading a modern webpage requires 80–100 requests. With 6 parallel connections, you're waiting in queues constantly.

### HTTP/2 — Multiplexing

- Binary framing (more efficient)
- **Multiplexing**: Multiple requests over a single TCP connection simultaneously
- **Header compression** (HPACK): Eliminates redundant headers
- **Server push**: Server can proactively send resources

**Result**: 3–5× fewer round trips, faster page loads.

**Remaining problem**: TCP head-of-line blocking — if a TCP packet drops, all streams wait.

### HTTP/3 — QUIC

- Built on **QUIC** (UDP-based transport protocol by Google)
- Eliminates TCP head-of-line blocking entirely
- **0-RTT connection resumption**: Reconnect without TLS handshake for known servers
- Built-in encryption (TLS 1.3)

**Used by**: Google, YouTube, Facebook. ~25% of web traffic as of 2024.

---

## Real-Time Communication Patterns

### Traditional Polling

Client asks "anything new?" on a timer (e.g., every 30 seconds).

```
Client → Server: GET /updates
Server → Client: (empty or new data)
# Repeat after 30s
```

**Pros**: Simple, works everywhere
**Cons**: High server load, high latency (you might miss updates for up to 30s)

### Long Polling

Client sends a request, server holds it open until there's new data (or timeout).

```
Client → Server: GET /updates (HTTP request)
# Server holds connection for up to 30s
Server → Client: (data when available, or 204 after 30s timeout)
Client → Server: Immediately re-opens a new request
```

**Pros**: Near-real-time, works behind firewalls/proxies
**Cons**: High server resource usage (thread per connection), latency on reconnect

**Used by**: Early chat apps, some notifications systems

### Server-Sent Events (SSE)

Server pushes events over a persistent HTTP connection. **One-way: server → client only**.

```javascript
// Client
const es = new EventSource('/stream')
es.onmessage = (e) => console.log(e.data)
```

**Pros**: Simple, auto-reconnect, works over HTTP/2, browser-native
**Cons**: One-way only, limited to UTF-8 text, max ~6 connections per domain on HTTP/1.1

**Used by**: Live dashboards, stock tickers, progress indicators

### WebSockets

Full-duplex, persistent TCP connection. Both client and server can send messages at any time.

```
1. HTTP Upgrade request
2. Server responds with 101 Switching Protocols
3. Bidirectional messaging begins
```

**Pros**: True bidirectional, low overhead (no HTTP headers per message), low latency
**Cons**: More complex infrastructure (stateful, doesn't work well with standard load balancers), can't use HTTP cache, not HTTP/2 compatible

**Used by**: Chat (WhatsApp Web, Slack), collaborative editing (Google Docs), multiplayer games, trading platforms

### Comparison

| Method | Direction | Protocol | Latency | Complexity | Best For |
|--------|-----------|----------|---------|------------|---------|
| Polling | C→S | HTTP | High | Low | Infrequent updates |
| Long Polling | C→S, S→C | HTTP | Medium | Medium | Notifications |
| SSE | S→C | HTTP | Low | Low | Live feeds, dashboards |
| WebSockets | Bidirectional | WS | Very Low | High | Chat, real-time collab |

---

## DNS (Domain Name System)

DNS translates human-readable names (`api.example.com`) into IP addresses.

### Resolution Flow

1. Browser checks local cache (OS-level DNS cache)
2. Query goes to **recursive resolver** (your ISP or 8.8.8.8)
3. Recursive resolver queries **root nameservers** (13 globally)
4. Root delegates to **TLD nameserver** (`.com`, `.io`, etc.)
5. TLD delegates to **authoritative nameserver** for `example.com`
6. Authoritative nameserver returns IP
7. Result cached by TTL (time-to-live)

### DNS Record Types

| Record | Purpose | Example |
|--------|---------|---------|
| A | IPv4 address | `api.example.com → 1.2.3.4` |
| AAAA | IPv6 address | `api.example.com → 2001:db8::1` |
| CNAME | Alias to another domain | `www → example.com` |
| MX | Mail server | Used by email routing |
| TXT | Arbitrary text | SPF records, domain verification |
| NS | Nameserver delegation | Points to authoritative server |

### DNS for Load Balancing

**Round-robin DNS**: Return different A records for the same name on each query.
**Weighted DNS**: Return some IPs more frequently than others for traffic splitting.
**Geo DNS (GeoDNS)**: Return different IPs based on requester's location (CDN edge selection).

### TTL Trade-offs

- Low TTL (60s): Fast propagation of changes, more DNS queries, higher load on resolvers
- High TTL (86400s = 1 day): Fewer queries, but DNS changes take days to propagate

---

## TLS (Transport Layer Security)

TLS encrypts communication between client and server. Replaces the deprecated SSL.

### TLS 1.3 Handshake (simplified)

1. Client sends `ClientHello` with supported cipher suites
2. Server sends `ServerHello` + certificate
3. Key exchange (ECDHE), derive session keys
4. Secure communication begins

**Improvement over TLS 1.2**: Only **1 RTT** (vs 2 RTTs), or **0-RTT** for resumed sessions.

### Certificate Concepts

- **CA (Certificate Authority)**: Trusted third party that signs certificates (Let's Encrypt, DigiCert)
- **mTLS (Mutual TLS)**: Both client and server authenticate. Used in service-to-service communication.
- **Certificate pinning**: App refuses connections unless server presents a specific certificate. Used in mobile banking apps.

---

## Interview Tips

**WebSockets vs SSE decision**: "Since this is a chat app, we need bidirectional real-time messaging — WebSockets are the right choice. For a live score board that only pushes updates, SSE would be simpler."

**DNS in your architecture**: Mention DNS as the entry point. "The client resolves api.example.com to a load balancer IP via DNS."

**HTTP/2 for internal services**: "Our internal services communicate over HTTP/2 which gives us header compression and multiplexing. We use gRPC which is built on HTTP/2."

**TLS everywhere**: Assume TLS in any production system. You don't need to design the TLS termination in detail unless asked, but mention it: "HTTPS enforced, TLS terminates at the load balancer."
