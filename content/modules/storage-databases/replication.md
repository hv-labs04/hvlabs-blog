---
title: "Database Replication"
date: "2024-02-05"
description: "Master-slave, master-master, synchronous vs asynchronous replication, failover, and read replicas — how databases stay available at scale"
tags: ["System Design", "Databases", "Replication", "High Availability"]
---

## Why It Matters

Replication is how you achieve high availability and scale reads beyond a single server. Without replication, a single database failure takes down your entire system. With it, you can handle millions of read queries per second and survive hardware failures without data loss.

---

## What Is Replication?

Replication is the process of keeping multiple copies of data synchronized across multiple servers. The server that accepts writes is called the **primary** (or master). Servers that receive copies of those writes are called **replicas** (or secondaries/slaves).

---

## Master-Slave (Primary-Replica)

The most common replication topology.

```
              Writes
Client ────→ Primary ────→ Replica 1
                     └───→ Replica 2
                     └───→ Replica 3
                               ↑
                           Reads routed here
```

**How it works**:
1. Application writes to primary only
2. Primary records changes in a **binary log** (MySQL) or **WAL** (PostgreSQL)
3. Replicas continuously read and apply these changes
4. Application reads can be distributed across replicas

**Benefits**:
- Read scalability (add more replicas for more read throughput)
- Replica can serve as a hot standby for failover
- Replicas can be used for analytics/reporting without impacting primary

**Limitations**:
- Writes are bottlenecked to primary (vertical scale only for writes)
- Replication lag means replicas may serve stale data

### Replication Lag

The time between a write on the primary and that write being visible on replicas is called **replication lag**. Typical lag:
- Same datacenter: microseconds to milliseconds
- Cross-region: tens to hundreds of milliseconds

**Problems caused by replication lag**:
- User posts a comment, then reloads — doesn't see their own comment (read-your-own-writes violation)
- "Monotonic reads" violation: user refreshes and sees older data than before (routed to different replica)

**Mitigations**:
- Route a user's reads to the same replica they just wrote to (sticky sessions)
- Read from primary for "critical" reads
- Use version tokens to detect stale reads

---

## Synchronous vs Asynchronous Replication

| Mode | How | Durability | Latency |
|------|-----|-----------|---------|
| **Synchronous** | Primary waits for at least one replica to confirm write | Very high (no data loss if primary fails) | Higher (waiting for network) |
| **Asynchronous** | Primary acknowledges write after writing locally | Primary data safe; replica lag possible | Lower |
| **Semi-synchronous** | Wait for one replica, rest async | One replica guaranteed up-to-date | Middle ground |

**PostgreSQL synchronous_standby_names**: Specify which replicas must confirm writes synchronously.

**MySQL semi-sync replication**: Default in many cloud setups (e.g., Amazon RDS Multi-AZ).

**Trade-off**: Synchronous replication adds ~1–5ms latency for same-region replicas. For cross-region, this becomes 50–200ms — usually unacceptable for writes.

---

## Master-Master (Multi-Primary) Replication

Both nodes accept writes and replicate to each other.

```
Client A → Primary 1 ←→ Primary 2 ← Client B
```

**Use case**: Multi-region writes where you want users in different regions to write to a nearby primary.

**The challenge — write conflicts**:
- What happens if Client A updates row X on Primary 1 and Client B updates the same row X on Primary 2 at the same time?
- Both primaries have different versions of the same row

**Conflict resolution strategies**:
- **Last-write-wins (LWW)**: Use timestamps, most recent write wins (can lose data)
- **Application-level conflict detection**: Detect conflicts and let the application decide
- **CRDTs**: Data structures that merge automatically (only works for specific data types)

**Avoid multi-master when possible**: The conflict complexity is significant. Instead, use geographic sharding (users from US → Primary 1, users from EU → Primary 2) to avoid conflicts.

---

## Read Replicas for Scale

A common pattern at companies like Instagram, Twitter, and Reddit:

```
Load Balancer
    │
    ├── Read path → Read Replica Pool (autoscaled)
    │
    └── Write path → Primary
```

**Scaling approach**:
- Add read replicas when read QPS grows (horizontal scale)
- Each replica is an independent copy, can handle its own read throughput
- 10–30 read replicas from a single primary is common
- Use ProxySQL or PgPool to route reads/writes transparently

---

## Failover

Failover is the process of promoting a replica to primary when the primary fails.

### Manual Failover
- DBA detects failure, manually promotes a replica
- Downtime: minutes to hours
- Used for planned maintenance

### Automatic Failover

Tools: MySQL Group Replication, PostgreSQL Patroni, AWS RDS Multi-AZ

**Process**:
1. Health check detects primary is down
2. Orchestrator selects the most up-to-date replica (fewest replication lag)
3. Replica promoted to primary
4. DNS record updated to point to new primary
5. Old replicas reconfigure to replicate from new primary

**Typical automatic failover time**: 30–60 seconds for cloud-managed databases.

### Failover Challenges

**Split-brain**: If network partition makes primary and replica both think they're primary:
- Both accept writes
- Data diverges
- When network heals, you have conflicting data

**Mitigation**: Fencing — the old primary must be shut down or blocked before the new one is promoted. STONITH (Shoot The Other Node In The Head) in distributed systems parlance.

---

## CQRS Pattern (Command Query Responsibility Segregation)

A pattern that maps well to primary-replica setups:

- **Commands** (writes) → go to primary database
- **Queries** (reads) → go to read replicas or a separate read-optimized data store

This separates the write model (normalized for integrity) from the read model (denormalized for speed).

---

## Replication in Practice

| Database | Replication | Notes |
|----------|------------|-------|
| PostgreSQL | WAL streaming | Synchronous or async, built-in |
| MySQL | Binary log | Semi-sync common in production |
| MongoDB | Oplog (replica sets) | Automatic failover, majority write concern |
| Cassandra | Peer-to-peer | No single primary, every node accepts writes |
| Redis Sentinel | Master-replica | Automatic failover for Redis |
| DynamoDB | Multi-AZ built-in | Transparent to user |

---

## Interview Tips

**Mention replication when discussing availability**: "For the primary database, I'd set up MySQL with semi-synchronous replication and at least 2 read replicas. This gives us read scalability and failover capability."

**Address replication lag**: "Since we're sending reads to replicas, we might see stale data. For the user's own recent posts, we'll route reads to the primary. For the general feed, eventual consistency is acceptable."

**Discuss failover strategy**: "In a failure scenario, the application will detect the primary is down via a health check and the load balancer will stop routing writes there. Our database orchestrator (Patroni) will promote a replica automatically within 60 seconds."
