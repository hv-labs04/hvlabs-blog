---
title: "Event-Driven Architecture"
date: "2024-02-23"
description: "Event sourcing, CQRS, saga pattern, and the outbox pattern — the design patterns powering modern distributed systems"
tags: ["System Design", "Event Sourcing", "CQRS", "Saga", "Distributed Systems"]
---

## Why It Matters

Event-driven architecture (EDA) is the foundation of scalable, loosely coupled microservices. Understanding patterns like event sourcing, CQRS, and sagas separates candidates who've thought about distributed systems from those who've only built CRUD apps.

---

## Core Concepts

### Event vs Command vs Query

| Type | Description | Example |
|------|-------------|---------|
| **Command** | Intent to change state | `PlaceOrder`, `CancelTrip` |
| **Event** | Fact that something happened (immutable) | `OrderPlaced`, `TripCancelled` |
| **Query** | Request for data, no side effects | `GetOrderStatus` |

**Commands can fail** (validation, business rules). **Events have already happened** — they're facts.

---

## Event Sourcing

Traditional databases store current state. Event sourcing stores **the sequence of events that led to that state**.

### Traditional (State-Based)

```
DB: { order_id: 1, status: "shipped", total: 100 }
# Past state is gone — you can't see the journey
```

### Event Sourcing

```
Event Log:
  1. OrderCreated  { id: 1, items: [...], total: 100 }
  2. PaymentProcessed { order_id: 1, amount: 100 }
  3. OrderShipped  { order_id: 1, tracking: "1Z999..." }

Current state = replay all events from the beginning
```

### Benefits

1. **Complete audit log**: Every change is recorded — crucial for compliance, debugging, fraud detection
2. **Time travel**: Reconstruct state at any point in time (replay up to event N)
3. **Event replay**: Rebuild projections/read models from scratch by replaying events
4. **Debugging**: Reproduce bugs by replaying the exact sequence of events

### Challenges

1. **Eventual consistency**: Read models are updated asynchronously
2. **Event schema evolution**: Old events must still be processable after schema changes
3. **Snapshot optimization**: With millions of events, replaying all from the start is slow → save snapshots periodically
4. **Querying is hard**: Can't easily query event store like a database; need separate read models

**Used by**: Banking systems, accounting software, Amazon (every order = a sequence of events), Axon Framework applications

---

## CQRS (Command Query Responsibility Segregation)

CQRS separates the read model from the write model.

```
Write side (Commands):        Read side (Queries):
  OrderService → DB            ReadModel → Optimized DB
  (normalized, ACID)           (denormalized, optimized for reads)
```

### Why Separate?

- Write models need ACID, normalization, consistency
- Read models need speed, denormalization, specific query shapes
- Scale them independently (usually many more reads than writes)

### CQRS + Event Sourcing

These patterns are complementary (not required together, but common):

```
Command → CommandHandler → Write to Event Store → Events
                                                      ↓
                                           Event Handlers → Update Read Models

Query → ReadModel → Serve cached/denormalized data
```

**Example — Twitter**:
- **Write**: User posts tweet → `TweetCreated` event
- **Read model 1**: Follower timelines (pre-computed, denormalized)
- **Read model 2**: User profile aggregate
- **Read model 3**: Search index in Elasticsearch

Each read model is optimized for its specific query pattern.

---

## Saga Pattern (Distributed Transactions)

In a microservices architecture, you can't use database transactions across services. **Sagas** coordinate multi-step distributed operations.

### The Problem

```
PlaceOrder workflow:
  1. Reserve inventory
  2. Charge payment
  3. Create shipment

What if step 3 fails? Can't rollback steps 1 and 2 with a database transaction.
```

### Choreography-Based Saga

Services communicate through events. Each service listens for events and publishes its own.

```
OrderService → OrderCreated event
    → InventoryService listens → InventoryReserved event (or InventoryFailed)
        → PaymentService listens → PaymentCharged event (or PaymentFailed)
            → ShipmentService listens → ShipmentCreated event

Compensation (on PaymentFailed):
    PaymentService → PaymentFailed event
        → InventoryService listens → Releases inventory
```

**Pros**: Loose coupling, no central coordinator
**Cons**: Hard to track overall saga state; complex failure handling; "domain events spaghetti"

### Orchestration-Based Saga

A central saga orchestrator coordinates all steps.

```
SagaOrchestrator:
  → Call InventoryService.reserve()
  → On success: Call PaymentService.charge()
  → On success: Call ShipmentService.create()
  → On failure at any step: Call compensating transactions
```

**Pros**: Easier to reason about, centralized state
**Cons**: Orchestrator can become a bottleneck; coupling to orchestrator

### Compensating Transactions

Instead of true rollback (impossible across services), sagas use **compensation** — explicit reverse operations:

| Step | Forward | Compensating |
|------|---------|-------------|
| Reserve inventory | `reserve(itemId, qty)` | `release(itemId, qty)` |
| Charge payment | `charge(userId, amount)` | `refund(userId, amount)` |
| Create shipment | `createShipment(orderId)` | `cancelShipment(orderId)` |

**Critical**: Compensating transactions must be idempotent — they may be called multiple times.

---

## The Outbox Pattern

The fundamental problem: how do you atomically update your database AND publish an event?

### The Problem

```python
# Naive approach — NOT atomic!
db.update_order(order_id, status="confirmed")
kafka.publish("order-confirmed", order_id)  # What if this fails?
# Database updated, but event never published → inconsistency
```

### The Outbox Solution

Write the event to the same database as your state change, in the same transaction.

```python
# Atomic operation
with db.transaction():
    db.update_order(order_id, status="confirmed")
    db.insert_outbox(event_type="OrderConfirmed", payload={"order_id": order_id})
    # Both succeed or both fail together
```

A separate **outbox processor** reads from the outbox table and publishes to Kafka:

```python
while True:
    events = db.query("SELECT * FROM outbox WHERE published = false LIMIT 100")
    for event in events:
        kafka.publish(event.type, event.payload)
        db.update_outbox(event.id, published=True)
```

### CDC (Change Data Capture) Alternative

Instead of a polling outbox processor, use **Debezium** to watch the database's binary log (WAL) and stream changes to Kafka automatically. This is more efficient and near-real-time.

```
PostgreSQL WAL → Debezium → Kafka
```

---

## Event-Driven Architecture Comparison

| Pattern | Problem Solved | Complexity | Use When |
|---------|--------------|-----------|----------|
| Event Sourcing | Audit trail, state history | High | Finance, compliance, complex domain |
| CQRS | Read/write scaling imbalance | Medium | High read load, different query shapes |
| Saga (Choreography) | Distributed transactions, loose coupling | Medium | Many services, prefer decoupling |
| Saga (Orchestration) | Distributed transactions, clear control flow | Medium | Complex workflows, prefer clarity |
| Outbox | Atomic DB update + event publish | Low | Any service publishing events |

---

## Interview Tips

**Outbox is essential for correctness**: "Without the outbox pattern, there's a race condition between updating the database and publishing events. The outbox pattern ensures atomicity using the database itself."

**CQRS when reads and writes scale differently**: "Since reads are 100× more frequent than writes, I'd separate the read and write models. The write model is normalized PostgreSQL; the read model is a denormalized Redis cache."

**Saga for checkout flows**: "The checkout process involves inventory, payment, and shipping — three services. I'd use an orchestrated saga with compensating transactions so a payment failure automatically releases inventory."

**Event sourcing caution**: "Event sourcing adds significant complexity. I'd only use it for the order management domain where audit logs and temporal queries justify the overhead."
