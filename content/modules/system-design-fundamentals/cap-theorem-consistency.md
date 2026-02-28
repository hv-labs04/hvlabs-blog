---
title: "CAP Theorem & Consistency Models"
date: "2024-01-22"
description: "Understand CAP theorem, PACELC, and the full spectrum of consistency models—from strong consistency to eventual consistency—with real database examples"
tags: ["System Design", "Distributed Systems", "CAP Theorem", "Consistency"]
---

## Why It Matters

Every distributed system you design forces you to make explicit trade-offs between consistency, availability, and partition tolerance. CAP theorem gives you the vocabulary to reason about these trade-offs, and understanding consistency models tells you *how* consistent a system actually is.

Interviewers ask: "Would you use a SQL or NoSQL database for this?" The real answer requires understanding these trade-offs.

---

## CAP Theorem

CAP states that a distributed system can guarantee **at most two** of these three properties simultaneously:

| Property | Definition |
|----------|-----------|
| **Consistency** | Every read receives the most recent write or an error |
| **Availability** | Every request receives a (non-error) response |
| **Partition Tolerance** | The system operates despite network partitions |

### The Key Insight

In practice, **partition tolerance is non-negotiable**. Networks fail. You cannot build a real distributed system that stops working when packets drop. So the real trade-off is:

**CP vs AP** — when a network partition occurs, do you sacrifice availability (return errors until consistent) or consistency (serve potentially stale data to stay available)?

### CP Systems (prefer consistency)

When a partition occurs, the system refuses requests rather than risk returning stale data.

- **HBase**, **Zookeeper**, **etcd**, **Consul**
- Use when: financial transactions, inventory counts, anything where stale reads cause real harm

### AP Systems (prefer availability)

When a partition occurs, the system keeps responding with potentially stale data.

- **Cassandra**, **CouchDB**, **DynamoDB** (default), **DNS**
- Use when: social feeds, analytics, product catalogs, anything tolerant of brief inconsistency

### CA Systems (theoretical only)

Single-node relational databases like PostgreSQL are CA in isolation — but they can't be distributed without facing partitions. Most people mean "prefers CA" when network is healthy.

---

## PACELC: The Extended Model

CAP only describes behavior during partitions. **PACELC** extends this to describe normal operation:

> **If Partition** (P): choose A vs C
> **Else** (normal operation): choose L (Latency) vs C (Consistency)

| System | P → | Normal → |
|--------|-----|---------|
| DynamoDB | A | L |
| Cassandra | A | L |
| HBase | C | C |
| MongoDB (w:majority) | C | C |
| PostgreSQL (single node) | — | C |

This matters because: even without partitions, achieving strong consistency requires coordination (e.g., 2-phase commit, quorum reads), which adds latency.

---

## Consistency Models

From strongest to weakest:

### Strong / Linearizability

Every operation appears instantaneous and globally ordered. If you write X=1, any subsequent read anywhere returns 1.

- **Cost**: High latency, reduced availability
- **Examples**: etcd, Zookeeper, Google Spanner

### Sequential Consistency

All operations appear in some total order, and each node's operations appear in program order. Unlike linearizability, there's no real-time constraint.

- **Cost**: Medium latency
- **Examples**: Some distributed locks, CPU memory models

### Causal Consistency

Operations that are causally related are seen in order. Unrelated operations can appear in any order.

- **Cost**: Lower latency, no global coordination needed
- **Examples**: MongoDB (causal sessions), some social feed systems

**Classic example**: If you post "I'm engaged!" and then "Here's a photo!", causal consistency ensures readers see the text before the photo. But two unrelated users' posts might appear in different orders for different readers.

### Eventual Consistency

Given no new updates, all nodes will *eventually* converge to the same value. No guarantee of when.

- **Cost**: Lowest latency, highest availability
- **Examples**: DNS propagation, Cassandra (default), S3, DynamoDB (default)

### Read-Your-Own-Writes

A special case: a user always reads their own writes. Others might still see stale data.

- **Used in**: Social platforms (you see your own post immediately), user profile updates
- **Implementation**: Route user's reads to the node they just wrote to, or use version tokens

---

## Consistency Model Comparison

| Model | Latency | Availability | Complexity | Real Systems |
|-------|---------|-------------|------------|-------------|
| Linearizable | High | Low | High | etcd, Spanner |
| Sequential | Medium | Medium | Medium | Some DBs |
| Causal | Low-Med | High | Medium | MongoDB, COPS |
| Eventual | Low | Very High | Low | Cassandra, S3 |
| Read-Your-Writes | Low | High | Low | Facebook, Twitter |

---

## Real-World Database Examples

| Database | Default Consistency | Notes |
|----------|-------------------|-------|
| PostgreSQL | Strong (single node) | Serializable isolation |
| MySQL | Strong (single node) | Replication can lag |
| MongoDB | Eventual (replica sets) | Tunable per operation |
| Cassandra | Eventual | Tunable with quorum writes |
| DynamoDB | Eventual | Optional strong reads (2× cost) |
| Redis | Eventual (cluster) | AOF + replication |
| Google Spanner | External consistency | TrueTime-based |
| Apache HBase | Strong | Based on HDFS/ZooKeeper |

---

## Interview Tips

**"What consistency does your design need?"** — Always answer this before choosing a database. Social feeds can tolerate eventual consistency. Payment ledgers cannot.

**Tunable consistency**: Most modern databases let you trade consistency for latency per-operation. Cassandra's `QUORUM` vs `ONE` reads, DynamoDB's `ConsistentRead` flag. Mention this to show depth.

**The bank account example**: "If a user checks their balance on node A and then immediately checks on node B, could they see different balances?" If yes, that's not strongly consistent — and for banking, that's unacceptable.

**CAP in interviews**: Saying "I'll pick CP because it's a financial system" shows you understand trade-offs. Saying "I'll pick a consistent database" without mentioning why shows you know buzzwords.
