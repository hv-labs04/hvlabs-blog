---
title: "System Design Terminology and Getting Started"
slug: "system-design-terminology-and-getting-started"
date: "2024-01-10"
description: "Essential terminology and a practical guide to getting started with system design interviews"
tags: ["system-design", "interview", "distributed-systems", "fundamentals"]
featured: false
draft: false
module: "system-design-fundamentals"
moduleOrder: 1
---

System design interviews can be intimidating, but they don&apos;t have to be. Understanding the fundamental terminology and having a structured approach can make all the difference. Let&apos;s break down the essential concepts you need to know.

## Core Terminology

### Scalability

**Scalability** refers to a system&apos;s ability to handle growth. There are two main types:

- **Vertical Scaling (Scale Up)**: Adding more power to existing machines (CPU, RAM, storage)
- **Horizontal Scaling (Scale Out)**: Adding more machines to your system

Most modern systems prefer horizontal scaling because it&apos;s more cost-effective and provides better fault tolerance.

### Availability

**Availability** measures how often your system is operational. It&apos;s often expressed as a percentage:

- **99.9% (Three 9s)**: ~8.76 hours of downtime per year
- **99.99% (Four 9s)**: ~52.56 minutes of downtime per year
- **99.999% (Five 9s)**: ~5.26 minutes of downtime per year

### Reliability vs Availability

- **Reliability**: The probability that a system will perform correctly under stated conditions
- **Availability**: The percentage of time a system is operational

A system can be available but not reliable (e.g., returning errors), or reliable but not available (e.g., down for maintenance).

### Consistency

**Consistency** ensures that all nodes in a distributed system see the same data at the same time. Types include:

- **Strong Consistency**: All nodes see updates immediately
- **Eventual Consistency**: Nodes will eventually converge to the same state
- **Weak Consistency**: No guarantees about when consistency will be achieved

### CAP Theorem

The **CAP Theorem** states that in a distributed system, you can only guarantee two of three properties:

- **Consistency**: All nodes see the same data simultaneously
- **Availability**: System remains operational
- **Partition Tolerance**: System continues despite network failures

Most systems choose **AP** (Availability + Partition Tolerance) or **CP** (Consistency + Partition Tolerance).

### Load Balancing

**Load balancing** distributes incoming requests across multiple servers to prevent any single server from being overwhelmed. Types include:

- **Round Robin**: Distributes requests sequentially
- **Least Connections**: Routes to server with fewest active connections
- **IP Hash**: Routes based on client IP address
- **Geographic**: Routes based on geographic location

### Caching

**Caching** stores frequently accessed data in fast storage to reduce latency and database load. Common strategies:

- **Cache-Aside**: Application checks cache first, then database
- **Write-Through**: Write to cache and database simultaneously
- **Write-Back**: Write to cache first, database later
- **Refresh-Ahead**: Proactively refresh cache before expiration

### Database Types

- **SQL (Relational)**: Structured data with ACID properties (MySQL, PostgreSQL)
- **NoSQL**: Flexible schema, better for scale (MongoDB, Cassandra)
- **Key-Value**: Simple key-value pairs (Redis, DynamoDB)
- **Document**: Store documents (MongoDB, CouchDB)
- **Column-Family**: Store data in columns (Cassandra, HBase)
- **Graph**: Store relationships (Neo4j)

### Sharding

**Sharding** splits a database into smaller, more manageable pieces called shards. Each shard contains a subset of the data. Common strategies:

- **Range-Based**: Data split by ranges (e.g., A-M, N-Z)
- **Hash-Based**: Data split using hash function
- **Directory-Based**: Lookup service determines shard location

### Replication

**Replication** creates copies of data across multiple nodes for:

- **High Availability**: If one node fails, others can serve requests
- **Performance**: Read requests can be distributed
- **Geographic Distribution**: Data closer to users

Types include:
- **Master-Slave**: One master handles writes, slaves handle reads
- **Master-Master**: Multiple masters can handle writes
- **Multi-Master**: Multiple nodes can accept writes

### Message Queues

**Message queues** enable asynchronous communication between services:

- **Producer**: Sends messages to queue
- **Consumer**: Processes messages from queue
- **Broker**: Manages the queue (RabbitMQ, Kafka, SQS)

Benefits: Decoupling, reliability, scalability, and handling traffic spikes.

### CDN (Content Delivery Network)

A **CDN** is a network of geographically distributed servers that cache content closer to users, reducing latency and bandwidth costs.

### API Gateway

An **API Gateway** is a single entry point for all client requests, handling routing, authentication, rate limiting, and load balancing.

## Getting Started with System Design Interviews

### 1. Understand the Requirements

Start by clarifying:

- **Functional Requirements**: What the system should do
- **Non-Functional Requirements**: Performance, scalability, availability
- **Scale**: Expected traffic, data volume, read/write ratio
- **Constraints**: Budget, timeline, technology preferences

### 2. Estimate Scale

Make rough calculations:

- **Traffic**: Requests per second (RPS)
- **Storage**: Data size and growth rate
- **Bandwidth**: Data transfer requirements

Example: If you have 1 million daily active users, and each makes 10 requests per day:
- Daily requests: 1M × 10 = 10M requests/day
- Requests per second: 10M / (24 × 3600) ≈ 116 RPS
- Peak traffic: 116 × 3 (typical peak multiplier) ≈ 350 RPS

### 3. Design High-Level Architecture

Start with a broad view:

- **Client Layer**: Web, mobile, API clients
- **Load Balancer**: Distribute traffic
- **Application Servers**: Handle business logic
- **Database**: Store data
- **Cache**: Reduce database load
- **CDN**: Serve static content

### 4. Deep Dive into Components

For each component, discuss:

- **Why** you chose it
- **How** it works
- **Trade-offs** and alternatives
- **Scaling** considerations

### 5. Identify Bottlenecks

Think about potential issues:

- Single points of failure
- Database overload
- Network latency
- Storage limitations

### 6. Discuss Trade-offs

Every design decision has trade-offs:

- Consistency vs Availability
- Latency vs Throughput
- Cost vs Performance
- Simplicity vs Features

## Common Patterns

### Microservices

Break down monolithic applications into smaller, independent services that communicate via APIs.

### Event-Driven Architecture

Services communicate through events, enabling loose coupling and scalability.

### Database Per Service

Each microservice has its own database, preventing tight coupling.

### Saga Pattern

Manages distributed transactions across multiple services.

## Practice Tips

1. **Start Simple**: Begin with a basic design, then add complexity
2. **Think Out Loud**: Explain your reasoning
3. **Ask Questions**: Clarify requirements and constraints
4. **Consider Trade-offs**: Every decision has pros and cons
5. **Scale Gradually**: Start with a small system, then scale up
6. **Draw Diagrams**: Visual representations help communication

## Resources

- **Books**: &quot;Designing Data-Intensive Applications&quot; by Martin Kleppmann
- **Practice**: System Design Interview websites
- **Real Systems**: Study how companies like Google, Amazon, Netflix design their systems

## Next Steps

Now that you understand the fundamentals, you&apos;re ready to dive into designing real systems. In the next post, we&apos;ll design a URL shortener from scratch, applying these concepts in practice.
