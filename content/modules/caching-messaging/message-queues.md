---
title: "Message Queues: Kafka & RabbitMQ"
date: "2024-02-21"
description: "Kafka architecture, partitions, consumer groups, offsets — and how it compares to RabbitMQ. Message delivery semantics: at-most-once, at-least-once, exactly-once."
tags: ["System Design", "Kafka", "RabbitMQ", "Messaging"]
---

## Why It Matters

Message queues decouple producers from consumers, enabling async processing, buffering traffic spikes, and reliable communication between microservices. The choice between Kafka and RabbitMQ (and understanding their trade-offs) is a common system design discussion.

---

## Why Use a Message Queue?

**Without a queue** (synchronous):
```
Upload Service → Image Processing Service (synchronous)
# If image processor is slow, upload waits
# If image processor crashes, upload fails
# If traffic spikes, image processor overwhelms
```

**With a queue** (asynchronous):
```
Upload Service → Queue → Image Processing Service
# Upload returns immediately
# Image processor works at its own pace
# Queue buffers traffic spikes
# Processor failure doesn't affect upload
```

**Key benefits**:
- **Decoupling**: Producer and consumer don't need to be available simultaneously
- **Traffic leveling**: Queue absorbs burst traffic; consumer processes at steady rate
- **Resilience**: Failed consumers can retry from queue
- **Fan-out**: One message, many consumers

---

## Apache Kafka

Kafka is a distributed, durable, high-throughput event streaming platform.

### Core Architecture

```
Producers → Topics (partitioned, replicated) → Consumer Groups
```

**Key concepts**:

| Term | Definition |
|------|-----------|
| **Topic** | A named feed/stream of events (like a database table for events) |
| **Partition** | A topic is split into N partitions; each is an ordered, immutable log |
| **Offset** | Position of a message within a partition (monotonically increasing integer) |
| **Consumer Group** | Group of consumers that collectively consume a topic; each partition goes to exactly one consumer |
| **Broker** | A Kafka server; responsible for storing partitions |
| **Leader/Replica** | Each partition has a leader (handles reads/writes) and replicas (hot standby) |

### Partitions

Partitions are the core unit of parallelism and ordering in Kafka.

```
Topic "orders" with 4 partitions:
  Partition 0: [msg1, msg4, msg7, msg10, ...]
  Partition 1: [msg2, msg5, msg8, ...]
  Partition 2: [msg3, msg6, msg9, ...]
  Partition 3: [msg0, ...]

Messages within a partition: ordered
Messages across partitions: no global order
```

**Partition key**: Determines which partition a message goes to. Messages with the same key always go to the same partition — ensuring ordering for that key.

```python
# All events for user 123 go to the same partition
producer.send("orders", key="user_123", value={"order_id": 456})
```

**Rule**: Number of partitions determines max parallelism for consumers. 10 partitions = max 10 consumers in a group can consume in parallel.

### Consumer Groups

```
Topic: orders (4 partitions)
Consumer Group A (2 consumers):
  Consumer A1 → Partition 0, Partition 1
  Consumer A2 → Partition 2, Partition 3

Consumer Group B (4 consumers):
  B1 → P0, B2 → P1, B3 → P2, B4 → P3
```

- Each consumer group gets **all messages** independently
- Within a group, each partition is consumed by exactly one consumer
- Add consumers to scale; remove to consolidate
- Consumer groups enable multiple independent subscribers (billing service, analytics service, email service all consume the same events)

### Offsets and Commit

Kafka doesn't delete messages on consumption. Consumers track their position via offsets.

```
Consumer reads messages up to offset 42, commits: "I've processed up to 42"
On restart: consumer resumes from offset 43

# Auto-commit (can cause duplicate processing on crash)
enable.auto.commit=true

# Manual commit (control exactly when you acknowledge)
consumer.commitSync()  # after processing
```

### Kafka Durability

- **Replication factor**: Each partition replicated to N brokers (typically 3)
- **acks=all**: Producer waits for all ISR (In-Sync Replicas) to acknowledge
- **min.insync.replicas=2**: At least 2 replicas must confirm for a write to succeed
- Retention: Messages retained for a configurable period (default 7 days) regardless of consumption

---

## RabbitMQ

RabbitMQ is a traditional message broker based on the AMQP protocol.

### Architecture

```
Producers → Exchange → Queues → Consumers
```

| Component | Role |
|-----------|------|
| **Exchange** | Receives messages from producers, routes to queues |
| **Queue** | Buffer that stores messages until consumed |
| **Binding** | Rule connecting an exchange to a queue |
| **Consumer** | Subscribes to a queue, gets messages pushed |

### Exchange Types

| Type | Routing | Use Case |
|------|---------|---------|
| **Direct** | Exact routing key match | Task queue, RPC |
| **Fanout** | Broadcast to all bound queues | Notifications to multiple services |
| **Topic** | Pattern matching (*.order.*, email.#) | Event routing by category |
| **Headers** | Match on message headers | Complex routing |

### RabbitMQ vs Kafka

| Feature | RabbitMQ | Kafka |
|---------|----------|-------|
| **Model** | Push (broker pushes to consumers) | Pull (consumers pull from broker) |
| **Message retention** | Deleted after ACK | Retained for configured period |
| **Throughput** | ~50K msg/sec | Millions/sec |
| **Ordering** | Per-queue (not distributed) | Per-partition |
| **Replay** | No (message deleted after ACK) | Yes (rewind offset) |
| **Consumer model** | Competing consumers | Consumer groups |
| **Complexity** | Simpler operations | More complex (ZooKeeper/KRaft) |
| **Best for** | Task queues, RPC, complex routing | Event streaming, log aggregation, high throughput |

---

## Delivery Semantics

| Semantic | Guarantee | How |
|----------|-----------|-----|
| **At-most-once** | Message delivered 0 or 1 times (may lose) | Fire and forget, no ACK |
| **At-least-once** | Message delivered ≥1 times (may duplicate) | ACK after processing; retry on failure |
| **Exactly-once** | Message delivered exactly once | Transactions + idempotency (complex) |

### At-Least-Once + Idempotency = Effectively Exactly-Once

Most production systems use at-least-once delivery with idempotent consumers:

```python
def process_payment(message):
    payment_id = message.payment_id

    # Check if already processed (idempotency)
    if db.exists(f"processed_payment:{payment_id}"):
        return  # Skip duplicate

    # Process payment
    db.insert_payment(payment_id, message.amount)
    db.set(f"processed_payment:{payment_id}", True)

    consumer.ack(message)  # Only ACK after successful processing
```

### Kafka Exactly-Once

Kafka supports exactly-once semantics (EOS) since 0.11, using:
- **Idempotent producers**: Same message sent multiple times = stored once
- **Transactional API**: Atomic writes across multiple partitions

```python
producer = KafkaProducer(transactional_id='payment-processor-1')
producer.begin_transaction()
producer.send('processed-payments', key=payment_id, value=result)
producer.commit_transaction()  # Atomic
```

---

## Interview Tips

**Kafka vs RabbitMQ choice**: "For high-throughput event streaming where we need replay capability and multiple consumer groups — Kafka. For task queues with complex routing and lower volume — RabbitMQ."

**Partition design**: "I'd partition by user_id to ensure all events for a user are ordered. With 32 partitions, we can run 32 consumers in parallel."

**Delivery semantics matter**: "The payment service must be idempotent. We use at-least-once delivery from Kafka, with an idempotency key check in the consumer to deduplicate retries."

**Kafka for event sourcing**: "By retaining all events in Kafka with long retention, we can replay events to rebuild any downstream service's state — useful for migrations and disaster recovery."
