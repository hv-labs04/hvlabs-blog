---
title: "Service Discovery & Load Balancing"
date: "2024-03-09"
description: "Client-side vs server-side service discovery, Consul, Kubernetes DNS, and load balancing algorithms — round-robin, least connections, consistent hashing"
tags: ["System Design", "Service Discovery", "Load Balancing", "Microservices"]
---

## Why It Matters

In a microservices environment, services scale up and down constantly. Service A needs to call Service B — but how does it know where B is? Service discovery solves this. And once you have a list of healthy instances, load balancing determines which one to use.

---

## The Problem

```
Static configuration (bad):
  order_service_url = "http://192.168.1.100:8080"
  # Service IP changes on restart, scale, or failure → broken
```

In a dynamic cloud environment, services come and go. You need a way to:
1. **Register**: When a service starts, announce its address
2. **Discover**: When Service A needs Service B, find a healthy instance
3. **Deregister**: When a service stops (or fails health checks), remove it

---

## Client-Side Discovery

The client queries a **service registry** to get a list of healthy instances, then picks one using its own load balancing logic.

```
Service A → Service Registry (get instances of B)
         → [B:8080, B:8081, B:8082]
         → Pick B:8081 (round-robin)
         → HTTP call to B:8081
```

**Registry options**: Consul, Eureka (Netflix), etcd

**Pros**:
- Client has full control over load balancing strategy
- One fewer network hop (no proxy)
- Can implement sophisticated routing (zone-aware, latency-based)

**Cons**:
- Client must integrate with the registry (language-specific SDK)
- Each client reimplements load balancing logic
- More client complexity

**Used by**: Netflix (Eureka + Ribbon), Spring Cloud applications

---

## Server-Side Discovery

The client calls a fixed address (load balancer or service proxy). The infrastructure handles registry lookup and routing.

```
Service A → Load Balancer (http://order-service)
         → Load Balancer queries registry
         → Routes to B:8081
         → HTTP call to B:8081
```

**Tools**: AWS ELB/ALB, NGINX, HAProxy, Kubernetes Services

**Pros**:
- Client is simple (just calls a single URL)
- Load balancing logic centralized
- Language-agnostic

**Cons**:
- Load balancer is an additional network hop
- Load balancer can become a bottleneck or single point of failure (mitigated by using replicated LBs)

---

## Consul

Consul (HashiCorp) is a service mesh with built-in service discovery, health checking, and key-value store.

```yaml
# Service registration (in consul config or via API)
{
  "service": {
    "name": "order-service",
    "id": "order-service-1",
    "address": "10.0.1.100",
    "port": 8080,
    "check": {
      "http": "http://10.0.1.100:8080/health",
      "interval": "10s",
      "timeout": "5s"
    }
  }
}
```

**Consul's features**:
- **Service registration**: Services register themselves (or via sidecar)
- **Health checks**: HTTP, TCP, script, or TTL checks; unhealthy services removed from DNS
- **DNS interface**: Query `order-service.service.consul` to get IPs of healthy instances
- **HTTP API**: More fine-grained queries including filtering by tags, datacenter
- **KV store**: Distributed configuration and leader election

---

## Kubernetes Service Discovery

In Kubernetes, service discovery is built in via the Kubernetes **DNS** and **Services** API.

```yaml
# Kubernetes Service (server-side discovery)
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service   # Routes to pods with this label
  ports:
    - port: 80
      targetPort: 8080
```

**How it works**:
1. Create a Kubernetes Service with a selector
2. kube-proxy maintains virtual IP rules on each node
3. DNS entry created: `order-service.default.svc.cluster.local`
4. Clients call `http://order-service` → kube-proxy routes to a healthy pod

**K8s load balancing**: kube-proxy uses **iptables** (or ipvs) rules to randomly select a pod from the endpoints list. This is effectively random load balancing.

**For more advanced routing**: Use a service mesh (Istio) or an Ingress controller (NGINX, Traefik) with custom routing rules.

---

## Load Balancing Algorithms

Once you have a list of healthy instances, which one do you send the request to?

### Round-Robin

Send requests to instances in order, cyclically.

```
Requests: 1 → A, 2 → B, 3 → C, 4 → A, 5 → B ...
```

**Pros**: Simple, fair for uniform request costs
**Cons**: Doesn't account for server capacity differences or request duration

### Weighted Round-Robin

Like round-robin, but instances get traffic proportional to their weight.

```
A: weight=1, B: weight=2, C: weight=1
Requests: A, B, B, C, A, B, B, C ...
```

**Use**: When servers have different capacities (A is a small instance, B is large)

### Least Connections

Route to the instance with the fewest active connections.

```
A: 10 active connections
B: 2 active connections ← route here
C: 7 active connections
```

**Pros**: Better for variable-length requests (long-running queries, streaming)
**Cons**: Requires tracking active connections at the load balancer

### Least Response Time

Route to the instance with the lowest average response time + fewest active connections.

**Use**: When instances have different performance characteristics

### IP Hash / Consistent Hashing

Route requests from the same client (IP or user ID) to the same server.

```python
server = consistent_hash(client_ip) % num_servers
```

**Pros**: Session affinity (stateful connections), better cache hit rates
**Cons**: Uneven distribution if clients aren't uniformly distributed

**Use**: WebSockets (connection must stay on same server), stateful session-based apps, cache servers

---

## Health Checks

Load balancers must know which instances are healthy.

### Active Health Checks

Load balancer proactively polls each instance:

```
LB → GET /health → [200 OK] → healthy
     → timeout or 5xx → unhealthy → remove from pool
```

### Passive Health Checks

Load balancer observes real traffic — if instance returns errors, temporarily remove it.

**Combined approach**: Active checks to detect pre-traffic failures; passive checks for runtime issues.

### Graceful Shutdown

When an instance is shutting down (rolling deploy), it should:
1. Stop accepting new connections (fail health checks → LB removes it)
2. Finish processing existing requests
3. Shut down

```python
# Kubernetes preStop hook
preStop:
  exec:
    command: ["sleep", "15"]  # Wait for LB to remove from pool
# Then SIGTERM → drain connections → SIGKILL after terminationGracePeriodSeconds
```

---

## Interview Tips

**Server-side discovery is the default**: "In Kubernetes, services are discovered via DNS automatically. `http://order-service` resolves to the ClusterIP, and kube-proxy load balances across healthy pods."

**Least connections for variable workloads**: "For the transcoding service where jobs take variable time (seconds to minutes), I'd use least-connections load balancing rather than round-robin to avoid overloading slow instances."

**Consistent hashing for WebSockets**: "WebSocket connections are stateful — the client must stay connected to the same server. I'd use consistent hashing on user ID so reconnects land on the same server."

**Health checks are critical**: "Every service exposes a `/health` endpoint that checks database connectivity, queue depth, and any other critical dependencies. Load balancers poll this every 5 seconds."
