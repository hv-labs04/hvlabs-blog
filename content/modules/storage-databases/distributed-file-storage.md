---
title: "Distributed File & Object Storage"
date: "2024-02-09"
description: "HDFS, S3 internals, Google File System design, and the differences between object, block, and file storage systems"
tags: ["System Design", "Storage", "S3", "HDFS", "Distributed Systems"]
---

## Why It Matters

Most systems need to store large files — images, videos, documents, backups. Understanding how distributed storage systems work helps you design systems that can store petabytes of data reliably and serve it efficiently.

---

## Storage Types

| Type | Description | Examples | Use Cases |
|------|-------------|---------|---------|
| **Block storage** | Raw storage volumes, no filesystem | AWS EBS, GCP Persistent Disk | Database storage, VM disks |
| **File storage** | Hierarchical filesystem, shared via NFS/SMB | AWS EFS, NFS | Shared filesystems, legacy apps |
| **Object storage** | Flat namespace, key-value pairs | AWS S3, GCS, Azure Blob | Images, videos, backups, ML datasets |

**Object storage dominates for unstructured data** at scale. It's immutable (write once), infinitely scalable, and cheap.

---

## Google File System (GFS) — The Blueprint

Google published the GFS paper in 2003. It became the blueprint for HDFS, S3, and most distributed file systems.

### Architecture

```
GFS Master (1 or 3 servers)
    ├── File namespace (directories, file names)
    ├── Chunk metadata (which servers hold each chunk)
    └── Access control

GFS Chunkservers (thousands of commodity servers)
    ├── Store 64 MB chunks of data
    └── Each chunk replicated 3× across different servers
```

### Key Design Decisions

1. **Large chunks (64 MB)**: Reduces metadata server load; files are large sequential reads
2. **Single master**: Simpler, but the master is replicated for fault tolerance (not sharded)
3. **Relaxed consistency**: Files are append-only in most cases; concurrent appends may result in duplicated regions
4. **Replication factor 3**: Tolerate 2 simultaneous failures

### Reads and Writes

**Read flow**:
1. Client asks master: "Where are chunks of file X?"
2. Master returns chunkserver addresses (cached in client)
3. Client reads directly from chunkserver (no master involvement)

**Write flow**:
1. Client asks master which chunkservers hold the chunk
2. Master grants a **lease** to one chunkserver (the **primary**)
3. Client pushes data to all replica chunkservers (pipelined over TCP)
4. Primary applies the write, tells replicas to apply in same order
5. Acknowledgment returned to client

---

## HDFS (Hadoop Distributed File System)

HDFS is the open-source implementation of GFS concepts, central to the Hadoop ecosystem.

### Components

- **NameNode** (master): Manages metadata — file namespace, block locations. Single point of failure historically; now supports HA via standby NameNode.
- **DataNodes** (workers): Store actual data blocks (default 128 MB blocks, 3× replication)

**HDFS is optimized for**:
- Batch processing (MapReduce, Spark)
- Very large files (GB to TB)
- Sequential reads (not random access)

**HDFS is NOT good for**:
- Low-latency random access (HBase on top of HDFS for that)
- Many small files (NameNode memory pressure)
- Concurrent writes to the same file

---

## Amazon S3 Internals

S3 is an **object store** — objects are stored as flat key-value pairs in buckets. No real filesystem hierarchy (the `/` in keys is a UI convention only).

### S3 Architecture (simplified, not officially documented)

- Data is distributed across many storage nodes (think hundreds of servers per region)
- Each object is sharded/replicated across multiple **availability zones**
- A metadata service maps `(bucket, key)` → object location
- Immutable objects: S3 is write-once; "updates" create a new version

### S3 Consistency (as of 2020)

S3 upgraded to **strong read-after-write consistency** for all objects and all operations. This means: if you PUT an object, a subsequent GET will return the new value.

### S3 Performance

- **Request rate**: 3,500 PUT/COPY/POST/DELETE and 5,500 GET per second per prefix
- **Prefix sharding**: Spread objects across prefixes to parallelize: `a/`, `b/`, `c/` prefixes instead of all under `photos/`
- **Multipart upload**: Required for objects > 5 GB. Splits into parts, uploads in parallel, completes atomically.

### S3 Storage Classes

| Class | Use Case | Cost |
|-------|----------|------|
| S3 Standard | Frequent access | $$$ |
| S3-IA (Infrequent Access) | Accessed less often | $$ |
| S3 Glacier | Archival (minutes to hours retrieval) | $ |
| S3 Glacier Deep Archive | Archival (12-hour retrieval) | ¢ |

### S3 for System Design

Key features to mention:
- **Presigned URLs**: Temporary URLs allowing direct upload/download without exposing credentials
- **S3 Events → Lambda/SQS**: Trigger processing when objects arrive
- **Versioning**: Keep all versions of an object
- **Lifecycle policies**: Auto-transition to cheaper storage class after 30/90/365 days
- **Cross-region replication**: Replicate buckets across regions for DR

---

## Object vs Block vs File Storage Decision

| Scenario | Use |
|----------|-----|
| User-uploaded images, videos | Object storage (S3) |
| Database files | Block storage (EBS) |
| Shared configuration files | File storage (EFS) |
| ML training datasets | Object storage (S3) |
| Log files for analytics | Object storage |
| VM boot volumes | Block storage |

---

## Designing a File Storage Service (like Google Drive)

Key components:
1. **Metadata service**: Stores file hierarchy, ownership, version history in a relational DB
2. **Object storage**: Stores actual file content (use S3 or HDFS)
3. **Chunking service**: Split large files into 4 MB chunks for deduplication and parallel upload
4. **Deduplication**: Hash each chunk (SHA-256); if hash exists, don't re-upload (saves ~30% storage at Google Drive scale)
5. **Sync service**: Detects file changes on client, uploads deltas

```
Client → Chunker → Object Store (S3)
           ↓
      Metadata DB (PostgreSQL)
           ↓
      Sync Service → Other clients (via WebSockets/SSE)
```

---

## Interview Tips

**Separate metadata from data**: "I'd store file metadata (name, owner, size, permissions) in PostgreSQL for querying and the actual bytes in S3/HDFS."

**Mention chunking**: "For large file uploads (videos, backups), I'd chunk files into 4–8 MB parts and upload in parallel using S3 multipart upload."

**Presigned URLs**: "Clients upload directly to S3 using presigned URLs — this keeps large binary traffic out of my API servers entirely."

**Cost-efficiency**: "Older files would automatically transition to S3-IA after 30 days and Glacier after 90 days via lifecycle policies."
