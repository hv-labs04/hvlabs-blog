---
title: "Distributed Systems Fundamentals"
date: "2024-03-01"
description: "The 8 fallacies of distributed computing, network partitions, idempotency, two-phase commit, and why distributed systems are hard"
tags: ["Distributed Systems", "System Design", "Networking"]
---

## Why It Matters

Distributed systems are hard because they fail in ways that single-machine systems don't: messages get lost, clocks drift, nodes crash and recover with stale state. The engineers who build resilient distributed systems are the ones who deeply internalize why they're hard — not just the patterns, but the fundamental reasons those patterns exist.

---

## The 8 Fallacies of Distributed Computing

Peter Deutsch (Sun Microsystems) identified these false assumptions engineers make about networks:

1. **The network is reliable** — Packets are dropped, routers restart, cables get cut
2. **Latency is zero** — Every network call has latency (ms to seconds)
3. **Bandwidth is infinite** — Networks have limits; large payloads matter
4. **The network is secure** — Encryption, authentication, and authorization are your job
5. **Topology doesn't change** — IPs change, services scale in/out, DNS updates
6. **There is one administrator** — Multiple teams, policies, and ownership
7. **Transport cost is zero** — Network calls have both latency cost and monetary cost
8. **The network is homogeneous** — Different OS, language, protocol versions coexist

**These aren't academic**. Every resilient system design is a response to one of these fallacies.

---

## Network Partitions

A network partition is when a network failure splits your distributed system into isolated groups that can't communicate with each other.

```
Normal:
  Node A ←→ Node B ←→ Node C

After partition:
  Node A | Node B ←→ Node C
         ^-- can't communicate
```

**Partitions are inevitable** in any distributed system operating over a real network. This is why "P" in CAP is non-negotiable.

### Handling Partitions

When a partition occurs, you must choose:
- **Stop serving requests** until partition heals (CP — bank transfer)
- **Continue with potentially stale data** (AP — social feed)
- **Detect and reconcile** conflicts after partition heals (last-write-wins, vector clocks)

---

## Idempotency

An operation is **idempotent** if calling it multiple times produces the same result as calling it once.

```
Idempotent:   PUT /users/1  { name: "Alice" }    // Same result every time
Not Idempotent: POST /orders  { item: "Book" }    // Creates a new order each time
```

### Why Idempotency Matters

Network calls can fail ambiguously: did the server receive my request? Did it process it before crashing? The safe answer is to retry — but only if retries are safe (idempotent).

### Making Non-Idempotent Operations Safe: Idempotency Keys

```python
# Client generates a unique key for this operation
idempotency_key = "order_" + uuid4()

# Server: check if we've seen this key before
if db.exists(f"idem:{idempotency_key}"):
    return db.get(f"idem:{idempotency_key}")  # Return previous result

# First time: execute the operation
result = create_order(data)

# Store result with the key (expires after 24h)
db.setex(f"idem:{idempotency_key}", 86400, result)
return result
```

Stripe, Braintree, and all payment APIs use idempotency keys. Retrying a payment without an idempotency key causes double charges.

---

## Two-Phase Commit (2PC)

2PC is a distributed algorithm for achieving atomic commits across multiple nodes.

### Protocol

**Phase 1 — Prepare**:
1. Coordinator sends `PREPARE` to all participants
2. Each participant locks resources and writes to its log
3. Participant responds `YES` (ready to commit) or `NO` (cannot commit)

**Phase 2 — Commit or Abort**:
4. If all said YES: coordinator sends `COMMIT`; participants commit and release locks
5. If any said NO: coordinator sends `ABORT`; participants rollback

```
Coordinator → Prepare → [Shard1, Shard2, Shard3]
Coordinator ← Yes    ← [Shard1, Shard2, Shard3]
Coordinator → Commit → [Shard1, Shard2, Shard3]
Coordinator ← Done   ← [Shard1, Shard2, Shard3]
```

### 2PC Problems

1. **Blocking**: If coordinator crashes after PREPARE but before COMMIT, participants are stuck holding locks forever (in-doubt state)
2. **Single point of failure**: Coordinator failure can halt the entire transaction
3. **High latency**: 2 round trips, all participants must respond

### 2PC vs 3PC

Three-phase commit adds a `PRE-COMMIT` phase to reduce blocking, but adds another round trip and is rarely used in practice.

### Alternatives to 2PC

- **Saga pattern**: Break distributed transaction into compensatable steps (no locking)
- **Eventual consistency**: Accept that not all systems will be in sync immediately
- **Paxos/Raft**: For consensus on a single value, not multi-node transactions

---

## Fencing Tokens

Distributed locks can have subtle bugs. Even with a lock, a paused process might wake up and act after its lock has expired and been taken by another.

**The problem**:
```
1. Process A acquires lock, gets token 1
2. Process A pauses (GC, network issue)
3. Lock expires
4. Process B acquires lock, gets token 2
5. Process B writes to storage with token 2
6. Process A resumes — it still thinks it has the lock!
7. Process A writes to storage... overwriting Process B's work
```

**Fencing tokens** solve this:

```python
# Lock service returns monotonically increasing token
token = lock.acquire("resource", ttl=30)  # token = 42

# Every write to storage includes the token
storage.write("resource", data, require_token_gt=41)
# Storage rejects writes with token ≤ previous token
```

If Process A (token 41) tries to write after Process B (token 42) already wrote, the storage rejects it.

**Used by**: ZooKeeper epoch numbers, DynamoDB condition expressions, Etcd leases

---

## Clock Synchronization Problems

Distributed systems can't rely on wall clocks being synchronized.

**Physical clocks drift** — even with NTP synchronization, clocks can be off by milliseconds to seconds.

**The problem with timestamps for ordering**:
```
Node A: Event happened at 10:00:00.000
Node B: Event happened at 10:00:00.001
# Which actually happened first? We can't know for certain.
```

### Logical Clocks (Lamport Timestamps)

A counter that increments on each event, capturing causality without wall clocks.

Rules:
1. On each internal event: `clock++`
2. On send: attach `clock` to message
3. On receive: `clock = max(local_clock, received_clock) + 1`

If event A causally precedes event B, then `timestamp(A) < timestamp(B)`.

### Vector Clocks

Vector clocks track causality for each node:

```
Node A: [A:2, B:1, C:0]  — "I've seen 2 of my own events, 1 from B, 0 from C"
```

Vector clocks detect concurrent events (events with no causal relationship):
- If neither `V(A) ≤ V(B)` nor `V(B) ≤ V(A)`, the events are concurrent (possible conflict)
- Used by DynamoDB for conflict detection in multi-region deployments

---

## Interview Tips

**Idempotency is a must-have**: "All state-changing API calls accept an idempotency key. Clients can safely retry on network errors without causing duplicate operations."

**2PC is rarely the answer**: "2PC has availability and latency problems. For distributed transactions, I'd prefer a saga pattern with compensating transactions."

**Acknowledge clock problems**: "We can't rely on timestamps for ordering in a distributed system. For event ordering, I'd use a Kafka topic (ordered within a partition) rather than application timestamps."

**Partitions are inevitable**: "The system must be designed to handle network partitions gracefully. For the payment flow, we accept reduced availability during partitions rather than risk incorrect transactions."
