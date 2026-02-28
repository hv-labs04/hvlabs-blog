---
title: "Observability: Metrics, Logs & Tracing"
date: "2024-03-11"
description: "Prometheus, Grafana, ELK stack, Jaeger/OpenTelemetry, SLI/SLO/SLA definitions, and error budgets — building observable systems"
tags: ["System Design", "Observability", "Monitoring", "SRE"]
---

## Why It Matters

You can't run a distributed system without observability. When something goes wrong at 3 AM, observability is the difference between a 5-minute fix and a 5-hour outage. Understanding the three pillars of observability — metrics, logs, and traces — is expected at L5+ and is often a final-round interview topic.

---

## The Three Pillars

| Pillar | What | Answers |
|--------|------|---------|
| **Metrics** | Numeric measurements over time | "Is the system healthy? What's the error rate?" |
| **Logs** | Timestamped event records | "What happened exactly?" |
| **Traces** | Request journey across services | "Where is this request slow? Which service failed?" |

---

## Metrics: Prometheus & Grafana

### Prometheus

Prometheus is a pull-based metrics collection system. Services expose a `/metrics` HTTP endpoint; Prometheus scrapes it on a schedule.

**Metric types**:

| Type | Description | Example |
|------|-------------|---------|
| **Counter** | Monotonically increasing number | Total HTTP requests |
| **Gauge** | Value that goes up and down | Active connections, memory usage |
| **Histogram** | Distribution of values in buckets | Request latency |
| **Summary** | Quantiles calculated client-side | p50, p95, p99 latency |

```python
# Python prometheus_client example
from prometheus_client import Counter, Histogram

requests_total = Counter('http_requests_total', 'Total HTTP requests',
                          ['method', 'endpoint', 'status'])
request_duration = Histogram('http_request_duration_seconds', 'Request duration',
                              buckets=[.005, .01, .025, .05, .1, .25, .5, 1, 2.5])

# In your handler:
requests_total.labels(method='GET', endpoint='/api/users', status='200').inc()
with request_duration.time():
    handle_request()
```

### PromQL (Prometheus Query Language)

```promql
# Error rate (errors per second, averaged over 5 min)
rate(http_requests_total{status=~"5.."}[5m])

# P99 request latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Service availability (non-error requests / total requests)
1 - (rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]))
```

### Grafana

Grafana visualizes Prometheus metrics as dashboards. Connect to Prometheus as a data source, write PromQL queries, build panels.

**Essential dashboards**:
- **RED dashboard** (Rate, Errors, Duration) — one per service
- **USE dashboard** (Utilization, Saturation, Errors) — for infrastructure (CPU, memory, disk)

---

## Logs: ELK Stack

**ELK** = Elasticsearch + Logstash + Kibana (or modern variant with Beats/OpenSearch)

### The Pipeline

```
Services → Beats (log shipper) → Logstash (parse/transform) → Elasticsearch (store/index) → Kibana (visualize/search)
```

Or the lighter-weight version:
```
Services → Filebeat → Elasticsearch → Kibana
```

### Structured Logging

Unstructured logs are hard to query. Use structured (JSON) logs:

```python
# Unstructured (bad)
logger.info(f"User {user_id} logged in from IP {ip}")

# Structured (good)
logger.info("user_login", extra={
    "user_id": user_id,
    "ip": ip,
    "timestamp": "2024-01-15T10:30:00Z",
    "trace_id": "abc123"
})
# Output: {"level":"info","event":"user_login","user_id":123,"ip":"1.2.3.4",...}
```

**Kibana queries**:
```
user_id:123 AND level:ERROR
# Find all errors for user 123

service:payment AND duration:>1000
# Find slow payment operations
```

### Log Levels

| Level | Use |
|-------|-----|
| DEBUG | Detailed debugging information (dev only) |
| INFO | Normal operations, key events |
| WARN | Unexpected but non-critical situations |
| ERROR | Errors requiring attention |
| FATAL | Application cannot continue |

**In production**: Log at INFO+. DEBUG logging in production is expensive (disk I/O, log storage costs).

---

## Distributed Tracing: Jaeger & OpenTelemetry

Traces show the complete journey of a request across multiple services.

```
User request → API Gateway (5ms) → Order Service (20ms) → Payment Service (150ms) → DB Query (10ms)
Total: 185ms

Trace breakdown:
  [API Gateway: 5ms]
    └── [Order Service: 20ms]
          └── [Payment Service: 150ms]
                └── [DB Query: 10ms]
```

### OpenTelemetry

The industry standard for instrumentation. Language-agnostic, vendor-neutral. Collects traces, metrics, and logs.

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider

tracer = trace.get_tracer("order-service")

def create_order(user_id, items):
    with tracer.start_as_current_span("create_order") as span:
        span.set_attribute("user_id", user_id)
        span.set_attribute("item_count", len(items))

        # Child spans created in called functions inherit parent span
        inventory_result = check_inventory(items)
        payment_result = charge_payment(user_id, total)
        # ...
```

### Jaeger

Jaeger (CNCF) is a distributed tracing backend. OpenTelemetry collects and sends traces to Jaeger for storage and visualization.

**What Jaeger shows**:
- Full trace timeline (waterfall chart)
- Service dependency graph
- Latency distribution by service
- Root cause of errors in distributed calls

**Sampling**: At high traffic (10K req/sec), storing every trace is expensive. Use **head-based sampling** (sample 1% of all requests) or **tail-based sampling** (sample 100% of error traces, 1% of success traces).

---

## SLI, SLO, and SLA

Defined by Google SRE (Site Reliability Engineering):

### SLI (Service Level Indicator)

A quantitative measure of service behavior.

```
SLI = (valid requests that succeed) / (total valid requests)
```

**Common SLIs**:
- Availability: % of requests that return non-error responses
- Latency: % of requests completed in < 200ms
- Error rate: % of requests returning 5xx
- Freshness: % of cache hits returning data within 5 minutes of truth

### SLO (Service Level Objective)

An internal target for an SLI.

```
SLO: 99.9% of requests return 200 OK in < 200ms over 30 days
```

SLOs should be:
- Specific (measurable)
- Realistic (achievable without heroic effort)
- User-relevant (tied to what users care about)

### SLA (Service Level Agreement)

A contractual commitment to customers, backed by financial penalties (credits, refunds).

**Hierarchy**:
```
SLO ≥ SLA

Your SLO: 99.95% availability
Your SLA: 99.9% availability  (commit to less than you can achieve)
# Buffer between SLO and SLA absorbs measurement uncertainty
```

---

## Error Budgets

**Error budget** = 1 - SLO. The "allowed" downtime.

| SLO | Error Budget/Month |
|-----|-------------------|
| 99% | 7.3 hours |
| 99.9% | 43.8 minutes |
| 99.99% | 4.4 minutes |
| 99.999% | 26 seconds |

**How error budgets work**:
- If you're spending your error budget: slow down, focus on reliability
- If you have error budget remaining: ship features faster, take more risks
- Error budget depleted: freeze feature releases until budget replenishes

This creates a self-regulating system: reliability and velocity are in dynamic balance.

---

## Alerting

Good alerts are **actionable** — they tell you something is wrong and what to look at.

```yaml
# Prometheus alert rule
groups:
  - name: service-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.service }}"
          runbook: "https://wiki.example.com/runbooks/high-error-rate"
```

**Alert on symptoms, not causes**: Alert on "user-facing error rate > 1%" not "CPU > 80%". High CPU isn't always a problem; users experiencing errors always is.

---

## Interview Tips

**Mention all three pillars**: "I'd instrument the service with Prometheus metrics (request rate, latency, errors), structured JSON logging to an ELK stack, and distributed tracing with OpenTelemetry → Jaeger."

**Define SLOs early**: "Before implementing, I'd define the SLO: 99.9% of API requests complete in < 500ms. The error budget of 43 minutes/month guides our reliability investments."

**RED metrics as a starting point**: "For each service, I'd start with the RED metrics: Request rate, Error rate, and Duration. These three metrics answer 'is this service healthy?' without drowning in noise."

**Error budgets connect engineering and business**: "Error budgets give us an objective way to decide: if we've spent 80% of this month's error budget, we slow down feature releases and focus on reliability."
