---
title: "Search Engines & Full-Text Search"
date: "2024-02-11"
description: "How Elasticsearch works under the hood: inverted indexes, TF-IDF, BM25 scoring, and designing full-text search for production systems"
tags: ["System Design", "Search", "Elasticsearch", "Indexing"]
---

## Why It Matters

Almost every large application needs search: e-commerce product search, code search on GitHub, document search in Notion, tweet search on Twitter. Designing search correctly requires understanding how search engines work internally, not just how to call their APIs.

---

## The Inverted Index

A regular database stores "document → words". A search engine stores the inverse: **word → list of documents that contain it**.

```
# Regular (forward) index
Doc 1: "system design is important"
Doc 2: "design patterns matter"
Doc 3: "system architecture scales"

# Inverted index
"system"    → [Doc 1, Doc 3]
"design"    → [Doc 1, Doc 2]
"important" → [Doc 1]
"patterns"  → [Doc 2]
"matter"    → [Doc 2]
"architecture" → [Doc 3]
"scales"    → [Doc 3]
```

**Why this is powerful**: To answer "find documents containing 'system' AND 'design'", intersect the posting lists: `[Doc 1, Doc 3]` ∩ `[Doc 1, Doc 2]` = `[Doc 1]`.

### Posting Lists

Each word maps to a **posting list** containing:
- Document IDs
- Term frequency (how many times the term appears in each document)
- Position data (for phrase matching and proximity queries)

```
"system" → [(Doc1, freq=1, pos=[0]), (Doc3, freq=1, pos=[0])]
```

---

## Text Processing Pipeline

Before indexing, text goes through several transformations:

1. **Tokenization**: Split text into tokens — "System Design is Important" → ["System", "Design", "is", "Important"]

2. **Lowercasing**: → ["system", "design", "is", "important"]

3. **Stop word removal**: Remove common words — → ["system", "design", "important"]

4. **Stemming / Lemmatization**:
   - Stemming: "running" → "run", "designs" → "design"
   - Lemmatization: "better" → "good", "are" → "be"

5. **Synonym expansion** (optional): "quick" = "fast", "car" = "automobile"

The same pipeline runs at **query time** — so a search for "Designing Systems" also gets tokenized and stemmed to `["design", "system"]`.

---

## Relevance Scoring: TF-IDF and BM25

Not all matches are equal. Relevance scoring ranks results.

### TF-IDF

**Term Frequency (TF)**: How often does the term appear in this document?
- High TF = document is more about this topic

**Inverse Document Frequency (IDF)**: How rare is this term across all documents?
- Common words like "the" appear in every doc → low IDF → low score boost
- Rare words like "photosynthesis" appear in few docs → high IDF → high score boost

```
TF-IDF(term, doc) = TF(term, doc) × IDF(term)
```

### BM25 (Best Match 25)

BM25 is the modern improvement over TF-IDF, used by Elasticsearch (as of 7.0), Lucene, and most modern search engines.

**Improvements over TF-IDF**:
- **Term frequency saturation**: Diminishing returns for repeated terms (100 occurrences isn't 10× better than 10)
- **Document length normalization**: Penalizes very long documents (longer ≠ more relevant)

**Elasticsearch's default relevance algorithm is BM25**.

---

## Elasticsearch Architecture

Elasticsearch is a distributed search engine built on Apache Lucene.

### Core Concepts

| Term | Definition |
|------|-----------|
| **Index** | Like a database (collection of documents) |
| **Document** | A JSON object (like a row) |
| **Field** | A key-value pair within a document |
| **Shard** | A Lucene index — unit of distribution |
| **Replica** | Copy of a shard for redundancy and read scale |

### Cluster Architecture

```
ES Cluster:
  Master Node: manages cluster state, node membership
  Data Nodes: store shards, execute queries
  Coordinating Nodes: route requests, merge results

Index "tweets" with 5 primary shards + 1 replica each:
  Shard 0: Node 1 (primary), Node 3 (replica)
  Shard 1: Node 2 (primary), Node 1 (replica)
  Shard 2: Node 3 (primary), Node 2 (replica)
  ...
```

### Write Path

1. Document hits coordinating node
2. Shard determined by `hash(doc_id) % num_primary_shards`
3. Written to primary shard (Lucene in-memory buffer)
4. Flushed to on-disk **segment** periodically (near-real-time, ~1s delay)
5. Replicated to replica shards

**Segments are immutable**: Updates are implemented as write new + mark old as deleted. Lucene periodically **merges** segments (like compaction in LSM trees).

### Read/Search Path

1. Query hits coordinating node
2. Broadcast to all shards (both primary and replica for load balancing)
3. Each shard runs the query locally, returns top N results
4. Coordinator merges and re-ranks all results
5. Second round-trip fetches full documents for the final top N
6. Client gets results

---

## Full-Text Search vs Database Text Search

| Feature | Elasticsearch | PostgreSQL FTS |
|---------|--------------|---------------|
| Scale | Petabytes | Gigabytes |
| Relevance scoring | BM25 (powerful) | TF-IDF (basic) |
| Near-real-time indexing | ~1 second | Immediate |
| Schema flexibility | Schema-less | Requires columns |
| Aggregations | Fast | Slow on large data |
| Ops complexity | High | Low |
| Consistency | Eventual | Strong |

**Rule of thumb**: Use PostgreSQL `tsvector` for small datasets or when you need transactional consistency. Use Elasticsearch when you need relevance scoring, faceted search, or scale.

---

## Designing Search for a System

### Typical Architecture

```
Application → Write API → Kafka → ES Indexer → Elasticsearch Cluster
                                                     ↑
Application → Search API ──────────────────────────→ (search)
```

**Why Kafka in the middle?**
- Decouples writes from indexing
- Allows re-indexing by replaying the Kafka topic
- Handles backpressure during bulk indexing

### Re-indexing Strategy

When you change your schema or ranking algorithm:
1. Create a new index with the new mapping
2. Index all documents into the new index
3. Atomically swap the alias (alias `tweets_search` → `tweets_v2`)
4. No downtime

---

## Interview Tips

**Separate search from primary store**: "I'd use PostgreSQL as the source of truth and sync documents into Elasticsearch asynchronously via a change data capture (CDC) pipeline."

**Mention inverted index**: "Elasticsearch uses an inverted index — mapping terms to documents. This makes text search fast even over billions of documents."

**Near real-time caveat**: "Elasticsearch has ~1 second indexing latency. A new tweet won't appear in search results instantly, but that's acceptable for most use cases."

**Scaling Elasticsearch**: "Adding more data nodes lets us add more shards. For read heavy search workloads, more replicas increase query throughput — each replica can serve reads independently."
