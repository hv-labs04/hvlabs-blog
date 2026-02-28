---
title: "Consensus & Leader Election"
date: "2024-03-03"
description: "How Raft works step-by-step, Paxos conceptually, ZooKeeper for distributed coordination, and fencing tokens for safe leader election"
tags: ["Distributed Systems", "Consensus", "Raft", "ZooKeeper"]
---

## Why It Matters

Leader election and consensus are the bedrock of distributed systems. Kafka needs a controller. Cassandra needs a gossip protocol. Kubernetes needs an etcd cluster. Understanding how nodes agree on a single leader without a central coordinator is what separates L5 from L6 system design discussions.

---

## The Consensus Problem

**Consensus**: Get a group of nodes to agree on a single value, even in the presence of failures.

Requirements (FLP impossibility implies trade-offs):
- **Agreement**: All non-faulty nodes decide the same value
- **Validity**: The decided value was proposed by some node
- **Termination**: Every non-faulty node eventually decides

**FLP impossibility** (1985): In an asynchronous network with even one faulty process, consensus is impossible to guarantee. In practice, we add timeouts (make the system partially synchronous) to make consensus work.

---

## Raft: Consensus Made Understandable

Raft was designed to be understandable (unlike Paxos). It's used by etcd, CockroachDB, TiKV, and Consul.

### Node States

Every Raft node is in one of three states:

| State | Description |
|-------|-------------|
| **Follower** | Passive; receives log entries from leader |
| **Candidate** | Seeking votes to become leader |
| **Leader** | Handles all client requests; replicates log to followers |

### Terms

Time is divided into **terms** (monotonically increasing integers). Each term begins with a leader election. If no leader is elected, a new term starts.

Terms are Raft's logical clock — they let nodes detect stale messages from old leaders.

### Leader Election

1. Followers start with a random election timeout (150–300ms)
2. If follower doesn't hear from leader before timeout: becomes **Candidate**
3. Candidate increments term, votes for itself, sends `RequestVote` RPC to all others
4. Nodes grant vote if: (a) they haven't voted in this term yet, and (b) candidate's log is at least as up-to-date as theirs
5. Candidate wins with a **majority** of votes → becomes Leader
6. Leader sends heartbeats to all followers to prevent new elections

**Why random timeouts?** Reduces the chance of multiple candidates starting elections simultaneously, which would split the vote.

### Log Replication

Once a leader is elected:

1. Client sends command to leader
2. Leader appends command to its log as a new entry
3. Leader sends `AppendEntries` RPC to all followers in parallel
4. Once a **majority** of followers acknowledge: entry is **committed**
5. Leader responds to client
6. Leader notifies followers of commit on next heartbeat

```
Leader log:   [1: set x=1][2: set y=2][3: set x=3 ←committed]
Follower 1:   [1: set x=1][2: set y=2][3: set x=3]
Follower 2:   [1: set x=1][2: set y=2][3: ←not yet received]
Follower 3:   [1: set x=1][2: set y=2][3: set x=3]

Entry 3 committed because majority (Leader + F1 + F3) have it.
```

### Safety Property

Raft guarantees that if an entry is committed at index N, every future leader will have that entry. This is enforced by the vote grant condition: only vote for candidates whose log is at least as up-to-date.

### Raft Cluster Sizes

A cluster of N nodes tolerates **(N-1)/2** failures:
- 3 nodes → tolerates 1 failure
- 5 nodes → tolerates 2 failures
- 7 nodes → tolerates 3 failures

**Odd numbers are preferred**: Even numbers don't gain fault tolerance (4 nodes still only tolerates 1 failure, same as 3) but add coordination overhead.

---

## Paxos (Conceptually)

Paxos (Leslie Lamport, 1989) was the first widely-recognized consensus algorithm. It's notoriously difficult to understand and implement correctly.

### Single-Decree Paxos

Agrees on a single value through two phases:

**Phase 1 (Prepare)**:
- Proposer sends `Prepare(n)` with a proposal number n
- Acceptors promise not to accept lower proposals, return highest previously accepted value

**Phase 2 (Accept)**:
- If proposer gets majority responses: sends `Accept(n, value)` to acceptors
- Acceptors accept unless they've promised to a higher proposal number

**Multi-Paxos** extends this for a sequence of values (like a log), optimizing away Phase 1 for a stable leader.

**Paxos vs Raft**: Raft was explicitly designed to be Paxos-equivalent but more understandable. Modern systems almost universally choose Raft.

---

## ZooKeeper

ZooKeeper is a distributed coordination service used for leader election, distributed locks, configuration management, and service discovery.

### Data Model

ZooKeeper stores data in a hierarchical namespace (like a filesystem):

```
/
├── /config
│   ├── /config/kafka → {broker_list: "..."}
│   └── /config/db → {host: "..."}
├── /locks
│   └── /locks/resource_X → "node_1"  (ephemeral)
└── /leader
    └── /leader/kafka → "broker_2"  (ephemeral)
```

### Znode Types

| Type | Description |
|------|-------------|
| **Persistent** | Survives client disconnect |
| **Ephemeral** | Deleted when client session ends — key for leader election |
| **Sequential** | ZooKeeper appends a monotonically increasing number to the path |

### Leader Election with ZooKeeper

```python
# Each node tries to create an ephemeral sequential node
path = zk.create("/election/node_", ephemeral=True, sequence=True)
# Creates: /election/node_0000001, /election/node_0000002, etc.

# The node with the SMALLEST sequence number is the leader
children = sorted(zk.get_children("/election"))
leader = children[0]  # Smallest = leader

if path.endswith(leader):
    # I am the leader!
    become_leader()
else:
    # Watch the node with the PREVIOUS sequence number
    # If it disappears, re-check if I'm now the leader
    prev_node = children[children.index(my_node) - 1]
    zk.exists(f"/election/{prev_node}", watch=self.on_change)
```

**Why watch the previous node** (not the leader)? Prevents the "herd effect" — if all nodes watch the leader, when it dies, all N nodes simultaneously try to re-elect. With sequential watches, only one node is notified.

### ZooKeeper Guarantees

- **Sequential consistency**: Writes from clients are applied in order
- **Atomicity**: Updates either succeed or fail entirely
- **Single system image**: Client sees the same view regardless of which server it connects to
- **Reliability**: Once change applied, it persists
- **Timeliness**: Client's view is up-to-date within a bounded time

---

## etcd: The Modern ZooKeeper Alternative

etcd (used by Kubernetes) is a distributed key-value store using Raft consensus.

**Why etcd over ZooKeeper?**
- Simpler API (gRPC-based, not Zab protocol)
- Leases replace ephemeral nodes
- Watch API is more efficient
- First-class support for Kubernetes

```python
# etcd lease for leader election
lease = etcd.grant(ttl=10)  # 10-second lease
etcd.put("/leader", hostname, lease=lease)

# Keep lease alive while healthy
while True:
    etcd.refresh(lease)
    time.sleep(5)
# If we crash, lease expires, another node can take over
```

---

## Interview Tips

**Use Raft terminology**: "I'd use etcd (which uses Raft) for leader election. The current leader writes a key with a 10-second TTL lease and refreshes it every 5 seconds. If the leader dies, the lease expires within 10 seconds and a new election happens."

**Cluster sizing**: "For the metadata service, I'd run a 5-node Raft cluster. This tolerates 2 simultaneous failures, which covers most failure scenarios without the overhead of a larger cluster."

**Don't implement consensus yourself**: "I'd use etcd or ZooKeeper rather than implementing consensus from scratch. These are battle-tested and handle the edge cases that are easy to get wrong."

**Raft is not for every service**: "Raft adds latency because writes require a round trip to a majority of nodes. I'd only use it for coordination metadata, not for the hot data path."
