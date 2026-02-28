---
title: "API Design: REST, GraphQL & gRPC"
date: "2024-01-24"
description: "Compare REST, GraphQL, and gRPC. Learn API versioning, pagination strategies, and how to choose the right protocol for your system"
tags: ["System Design", "API Design", "REST", "GraphQL", "gRPC"]
---

## Why It Matters

APIs are the contracts between services and clients. Poor API design means breaking changes, overfetching, tight coupling, and scaling bottlenecks. In system design interviews, you're often expected to define the core API endpoints as part of your design — and justify why you chose the protocol you did.

---

## REST (Representational State Transfer)

REST is the industry default for public-facing APIs. It uses standard HTTP methods and treats everything as a **resource**.

### Core Principles

- **Stateless**: Each request contains all information needed; no server-side session
- **Uniform interface**: Resources identified by URLs, manipulated via representations
- **Cacheable**: GET responses can be cached by default

### HTTP Methods

| Method | Use | Idempotent? | Safe? |
|--------|-----|-------------|-------|
| GET | Read resource | Yes | Yes |
| POST | Create resource | No | No |
| PUT | Replace resource | Yes | No |
| PATCH | Partial update | No | No |
| DELETE | Remove resource | Yes | No |

### Good REST Design

```
# User resource
GET    /users/{id}           # Get user
POST   /users               # Create user
PATCH  /users/{id}           # Update user
DELETE /users/{id}           # Delete user

# Nested resources
GET    /users/{id}/posts     # User's posts
POST   /users/{id}/follows   # Follow a user

# Actions (use nouns, not verbs — but some actions are OK)
POST   /payments/{id}/refund # Refund a payment
```

### REST Limitations

- **Overfetching**: Endpoint returns more data than needed
- **Underfetching**: Need multiple roundtrips to assemble a view
- **Versioning complexity**: `/v1/`, `/v2/` proliferation

---

## GraphQL

GraphQL lets clients **declare exactly the data they need** in a single request. Developed by Facebook (now Meta) to solve mobile app data fetching problems.

### How It Works

```graphql
# Client specifies exactly what it needs
query {
  user(id: "123") {
    name
    avatar
    posts(limit: 5) {
      title
      createdAt
    }
  }
}
```

One endpoint (`/graphql`), flexible queries, no overfetching.

### Key Concepts

- **Query**: Read data
- **Mutation**: Write data
- **Subscription**: Real-time stream via WebSockets
- **Schema**: Typed contract between client and server
- **Resolver**: Function that fetches data for each field

### GraphQL Strengths

- Perfect for complex, nested data (social graphs, dashboards)
- Self-documenting via introspection
- Type safety end-to-end
- Eliminates overfetching/underfetching

### GraphQL Weaknesses

- **N+1 problem**: Naive resolvers fire a DB query per object (need DataLoader)
- **Caching is harder**: Can't use HTTP cache headers easily on POST queries
- **Complex queries**: Malicious clients can request deeply nested data (need query depth limiting)
- Overhead for simple CRUD APIs

---

## gRPC (Google Remote Procedure Call)

gRPC is a high-performance RPC framework using **Protocol Buffers** (protobuf) as the serialization format and HTTP/2 for transport.

### How It Works

1. Define your service contract in a `.proto` file
2. Generate client/server code in any supported language
3. Call remote methods as if they were local

```protobuf
// user.proto
service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (stream User);
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}
```

### gRPC Strengths

- **Extremely fast**: Binary protobuf is 3–10× smaller than JSON, faster to parse
- **Strongly typed**: Contract-first, generated code prevents mismatches
- **Streaming**: Client, server, and bidirectional streaming built-in
- **HTTP/2**: Multiplexing, header compression, lower latency

### gRPC Weaknesses

- Not human-readable (binary format requires tooling)
- Browser support limited (needs gRPC-Web proxy)
- Schema evolution requires careful field numbering

---

## Protocol Comparison

| Feature | REST | GraphQL | gRPC |
|---------|------|---------|------|
| Protocol | HTTP/1.1 | HTTP/1.1 | HTTP/2 |
| Format | JSON | JSON | Binary (protobuf) |
| Performance | Good | Good | Excellent |
| Browser support | Native | Native | Needs proxy |
| Type safety | Manual | Schema-based | Generated code |
| Caching | Easy (HTTP cache) | Complex | Manual |
| Learning curve | Low | Medium | Medium |
| Streaming | Manual (SSE/WS) | Subscriptions | Native |
| Best for | Public APIs | Complex data graphs | Internal microservices |

---

## API Versioning

APIs evolve. How do you avoid breaking existing clients?

### URL Versioning (most common)
```
/api/v1/users
/api/v2/users
```
Pros: Obvious, easy to route. Cons: URL clutter, code duplication.

### Header Versioning
```
Accept: application/vnd.myapp.v2+json
API-Version: 2
```
Pros: Clean URLs. Cons: Less visible, harder to test in browser.

### Query Parameter Versioning
```
/api/users?version=2
```
Pros: Easy to test. Cons: Pollutes query params, often forgotten.

**Best practice**: Use URL versioning for major breaking changes. Use feature flags and backwards-compatible additions (adding new fields) for minor changes.

---

## Pagination Strategies

| Strategy | How | Pros | Cons |
|----------|-----|------|------|
| **Offset** | `?page=2&limit=20` | Simple, random access | Expensive at scale, drift with new data |
| **Cursor** | `?cursor=eyJpZCI6MTIzfQ` | Stable, efficient | No random access, opaque to user |
| **Keyset** | `?after_id=123&limit=20` | Fast (index scan), stable | Only forward navigation |
| **Time-based** | `?before=2024-01-01` | Natural for time series | Ties possible, non-uniform distribution |

**Rule of thumb**: Use cursor-based pagination for infinite scrolls (Twitter, Facebook). Use offset pagination for admin tools with random page access. Use keyset pagination for high-volume APIs (billions of rows).

---

## Interview Tips

**State your API before diving into architecture**: "The core operations are: create tweet, get timeline, follow user. Let me define these as REST endpoints…"

**Justify your protocol choice**: "I'll use REST for the public API since it's standard and cacheable. For the internal microservices communication, gRPC makes sense because we need low latency and have strong schema requirements."

**Mention idempotency for mutations**: "The payment endpoint should be idempotent — clients should send an idempotency key to prevent double-charging on retries."

**Address rate limiting**: "I'd add rate limiting headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`."
