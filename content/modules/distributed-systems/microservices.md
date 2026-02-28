---
title: "Microservices Patterns"
date: "2024-03-05"
description: "Monolith vs microservices trade-offs, circuit breaker, bulkhead, retry with backoff, BFF pattern, and service mesh — patterns for reliable distributed services"
tags: ["System Design", "Microservices", "Distributed Systems", "Resilience"]
---

## Why It Matters

Every sufficiently large tech company has moved to microservices — or is in the painful process of doing so. Understanding the trade-offs, failure patterns, and resilience patterns is essential for L5+ system design discussions.

---

## Monolith vs Microservices

### Monolith

All functionality in a single deployable unit.

```
Monolith:
  Users Module  ─┐
  Orders Module  ├→ Single Process → Single Database
  Payments Module─┘
```

**Pros**:
- Simple to develop, test, and deploy (one CI/CD pipeline)
- No network latency between modules
- Shared transactions (ACID across all modules)
- Easier debugging (single log stream, single process)

**Cons**:
- Scaling requires scaling the entire app (even if only one module is hot)
- Long deploy cycles (any change deploys everything)
- Language/framework lock-in for the whole team
- Single point of failure for the entire application

### Microservices

Services split by domain/capability, deployed and scaled independently.

```
Client → API Gateway ─→ User Service → User DB
                    ─→ Order Service → Order DB
                    ─→ Payment Service → Payment DB
```

**Pros**:
- Independent scaling (scale only hot services)
- Independent deployment (deploy order service without touching payment service)
- Technology flexibility (each service can use different languages/databases)
- Fault isolation (payment service crash doesn't kill user service)

**Cons**:
- Network calls replace function calls (latency, partial failures)
- Distributed tracing, monitoring is complex
- No distributed transactions (need sagas)
- Service discovery, load balancing, circuit breaking needed
- Operational complexity multiplies with number of services

### When to Use Each

**Start with a monolith**:
- Early-stage product (requirements change fast)
- Small team (microservices coordination overhead > benefit)
- Unclear service boundaries (premature splitting is painful)

**Migrate to microservices when**:
- Monolith deployment takes 2+ hours and multiple teams block each other
- One service's load requires scaling the entire app
- Teams want to move independently

**The Strangler Fig Pattern**: Don't rewrite your monolith. Incrementally extract services one by one while the monolith handles the rest.

---

## Circuit Breaker

The circuit breaker prevents cascading failures when a service is unavailable.

### States

```
CLOSED → (failure threshold reached) → OPEN → (timeout) → HALF-OPEN → (success) → CLOSED
                                                              ↓ (failure)
                                                            OPEN
```

| State | Behavior |
|-------|---------|
| **Closed** | Requests pass through normally; failures counted |
| **Open** | Requests fail immediately (fast fail); no calls to failing service |
| **Half-Open** | Allow a few probe requests; if they succeed, close; if fail, re-open |

```python
class CircuitBreaker:
    def call(self, func, *args):
        if self.state == "OPEN":
            if time.now() > self.timeout:
                self.state = "HALF_OPEN"
            else:
                raise CircuitBreakerOpenError("Service unavailable")

        try:
            result = func(*args)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise

    def on_failure(self):
        self.failure_count += 1
        if self.failure_count >= self.threshold:
            self.state = "OPEN"
            self.timeout = time.now() + 30  # 30s timeout
```

**Libraries**: Netflix Hystrix (Java, deprecated), Resilience4j (Java), Polly (.NET), pybreaker (Python), Go's go-circuit-breaker

**Use circuit breakers on all service-to-service calls**.

---

## Bulkhead Pattern

Isolate resources so that failure in one area doesn't exhaust resources for all.

**Named after ship bulkheads** — compartments prevent one leak from sinking the ship.

```python
# Without bulkhead: slow user-service calls block all threads
thread_pool = ThreadPool(max_workers=100)  # Shared pool

# With bulkhead: separate pools per downstream service
user_service_pool = ThreadPool(max_workers=20)
order_service_pool = ThreadPool(max_workers=30)
payment_service_pool = ThreadPool(max_workers=20)
# If user-service is slow, it only affects 20 threads, not all 100
```

**Also applies to**:
- Connection pools (separate DB connection pools per service)
- Semaphores (limit concurrent calls to each service)
- Separate rate limits per client

---

## Retry with Exponential Backoff + Jitter

Naive retries can overwhelm a recovering service.

```python
# Bad: immediate retries
for i in range(3):
    try:
        response = call_service()
        break
    except Exception:
        pass  # Immediately retry → hammers recovering service

# Good: exponential backoff with jitter
def call_with_retry(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return func()
        except RetriableError:
            if attempt == max_retries - 1:
                raise
            base_delay = 2 ** attempt          # 1s, 2s, 4s
            jitter = random.uniform(0, base_delay * 0.1)  # ±10%
            time.sleep(base_delay + jitter)
```

**Jitter prevents thundering herd**: If all clients back off to the same time, they all retry simultaneously. Jitter spreads the retries out.

**Only retry idempotent operations**. Never blindly retry POST /payments.

---

## BFF (Backend for Frontend)

Create separate API backends tailored to each type of client.

```
Mobile App → Mobile BFF → Microservices
Web App → Web BFF → Microservices
Partner API → Partner BFF → Microservices
```

**Why?** Mobile apps need compact responses (save bandwidth). Web apps need rich data for complex UIs. Partners need stable, versioned APIs. One generic API serves all poorly.

**BFFs** aggregate calls to multiple microservices, transform responses to match each client's needs, and handle client-specific auth flows.

---

## Service Mesh

A service mesh handles service-to-service communication transparently, without application code changes.

**What it provides**:
- **mTLS**: Automatic mutual TLS between all services
- **Load balancing**: Client-side load balancing with health checks
- **Circuit breaking**: At the infrastructure level
- **Distributed tracing**: Automatic span propagation
- **Retries and timeouts**: Configurable per-route
- **Traffic splitting**: A/B testing, canary deployments by percentage

**Popular service meshes**: Istio, Linkerd, Consul Connect

**Sidecar proxy model**: Each service pod runs a lightweight proxy (Envoy) as a sidecar. All traffic passes through the proxy.

```
Service A → Envoy Sidecar A → Network → Envoy Sidecar B → Service B
```

---

## Anti-Patterns to Avoid

**Distributed Monolith**: Split into services that are so coupled they must deploy together. Worst of both worlds.

**Chatty services**: Service A calls Service B calls Service C calls Service D for every request. Each hop adds latency and a failure point.

**Shared database**: Multiple services sharing one database. Defeats the purpose of microservices — they become coupled at the data layer.

**Synchronous chains**: A → B → C → D synchronously. The slowest link determines total latency; any failure cascades.

---

## Interview Tips

**Acknowledge microservices complexity**: "Microservices add operational overhead. I'd only split if the team has grown past 2-pizza team size and deployment friction is real."

**Always mention circuit breakers**: "Service-to-service calls should be wrapped in circuit breakers. If the payment service is down, the circuit opens and we fail fast rather than queuing up connections."

**Saga for distributed operations**: "The checkout flow spans 3 services. I'd use an orchestrated saga so a payment failure automatically triggers compensation (inventory release)."

**Service mesh for security**: "In a microservices setup, I'd run a service mesh (Istio) for automatic mTLS between services and centralized observability."
