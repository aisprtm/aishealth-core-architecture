# AisHealth Enterprise — Core Architecture & Domain Foundations

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![Database](https://img.shields.io/badge/PostgreSQL-Multi--Schema-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Message Broker](https://img.shields.io/badge/RabbitMQ-Transactional%20Outbox-FF6600?style=flat&logo=rabbitmq)](https://www.rabbitmq.com/)
[![Caching](https://img.shields.io/badge/Redis-7%20In--Memory-DC382D?style=flat&logo=redis)](https://redis.io/)
[![Walkthrough](https://img.shields.io/badge/YouTube-5--Min%20Architecture%20Demo-FF0000?style=flat&logo=youtube)](https://youtu.be/iMKNz35sLt8)

This repository serves as the public architectural specification, domain boundary blueprint, and engineering reference for **AisHealth Enterprise**—a high-integrity healthcare ERP, Hospital Information System (SIMRS), and Casemix ledger.

---

## 🏗️ Architectural Topology

AisHealth is engineered as a **Clean Architecture Modular Monolith** in Go, prioritizing operational simplicity, transactional integrity, and sub-millisecond query performance over distributed microservice complexity.

```
├── backend
│   ├── cmd
│   │   ├── api/main.go                 # Ingress entrypoint, timezone bootstrap & graceful shutdown
│   │   ├── cleaner/                    # Ephemeral session & expired draft flushers
│   │   └── replay_dlq/                 # Dead-letter queue inspection & replay CLI
│   ├── internal
│   │   ├── broker/                     # Global SSE real-time dispatcher
│   │   ├── config/                     # Strict environment & security configuration loader
│   │   ├── container/                  # Dependency injection container & singleton registry
│   │   ├── database/
│   │   │   ├── database.go             # Multi-schema manager, UUIDv7 & audit GORM hooks
│   │   │   ├── rabbitmq.go             # Reliable AMQP connection pool & worker queues
│   │   │   └── redis.go                # Resilient TLS-enabled Redis state engine
│   │   ├── middleware/                 # PBAC, JWT rotation, Rate limiting, Branch timezones
│   │   ├── models/                     # 46 Relational GORM domain schemas
│   │   ├── modules/                    # Isolated domain business logic (Service + Repo + Handler)
│   │   │   ├── auth/                   # PBAC enforcement & WebAuthn FIDO2 credentials
│   │   │   ├── medrec/                 # Clinical examination, CPOE & triage state machine
│   │   │   ├── pharmacy/               # FIFO batch valuation, Stock ledger & SIPNAP reporting
│   │   │   ├── transaction/            # Cashier, Workstations, QRIS & billing engine
│   │   │   └── specialty/              # HD, IBS/Surgery, Gizi, ANC, MTBS specialized clinical tabs
│   │   └── workers/                    # Outbox relay, SIEM audit worker, asynchronous dispatchers
```

---

## 🔑 Key Engineering Implementations

### 1. Zero-Dual-Write Transactional Outbox
To eliminate distributed data corruption between PostgreSQL transactions and message broker events, every state-mutating operation writes an event payload to `models.OutboxEvent` within the same database transaction:

```
[HTTP Request] 
      │
      ▼
[Go Service Layer]
      │
      ├── Begin DB Transaction
      │     ├── 1. Mutate Relational State (e.g., Dispense Medicine)
      │     ├── 2. Update Stock Ledger Balance (FIFO Valuation)
      │     └── 3. Insert Outbox Record (Payload, Exchange, Topic)
      └── Commit DB Transaction
            │
            ▼ (Async Polling / CDC Sweep)
[Outbox Relay Worker] ──► [RabbitMQ Broker] ──► [Background Consumers]
```

* **Guarantee:** At-least-once message delivery to downstream consumers (audit logging, electronic prescriptions, billing settlements).
* **Failure Mitigation:** Failed messages are routed to Dead-Letter Queues (DLQ) with jittered exponential backoff.

### 2. Timezone Sovereignty (Pure UTC Runtime)
* The Go runtime is strictly maintained in **UTC** (`time.Local` mutation is forbidden).
* Multi-branch regional timezones (e.g., Asia/Jakarta, Asia/Makassar, Asia/Jayapura) are evaluated dynamically per branch via HTTP middleware and converted deterministically at the I/O boundary.

### 3. Native Database Defensive Constraints
Data integrity is enforced at the PostgreSQL engine level, not merely at the application layer:
* **Biological Boundary Guards:** Check constraints reject negative vitals and out-of-bound readings (`sp_o2 BETWEEN 0 AND 100`, `sys >= 0`, `dia >= 0`).
* **Trigram Indexing:** Accelerated full-text search across drug classifications, ICD-10 diagnostic codes, and master specialties using `pg_trgm` GIN indexes.
* **UUIDv7 Primary Keys:** Native time-sortable 128-bit identifiers to prevent B-Tree index fragmentation under high-frequency writes.

---

## 📊 Audited API Chains & Domain Coverage

AisHealth features **62 audited end-to-end transaction chains**, fully traced from client interfaces down to repository database queries:

| Domain | Scope & Responsibilities |
| :--- | :--- |
| **Clinical EMR / CPOE** | Outpatient triage, CPPT handover, electronic prescribing, allergy alerts |
| **Inpatient & ICU** | Bed allocation graphs, electronic MAR (eMAR), fluid monitoring |
| **Pharmacy & Inventory** | Multi-branch transfer orders (IBT), batch tracking, expiration monitoring |
| **Billing & Cashier** | Multi-payer tariff engine, dynamic QRIS generation, workstation pair-tokens |
| **Surgical & HD** | Operating theater booking (IBS), dialysis observation logs |

---

## 📹 Full System Demonstration

A dense 5-minute technical walkthrough demonstrating the live platform, state boundaries, and schema architecture:

👉 **[Watch the 5-Minute Technical Demo on YouTube](https://youtu.be/iMKNz35sLt8)**

---

## 👤 Author

* **Haris Pratama** — Full-Stack & Systems Engineer
* Email: [aisharis@proton.me](mailto:aisharis@proton.me)
* LinkedIn: [linkedin.com/in/haris-pratama-dev](https://www.linkedin.com/in/haris-pratama-dev/)
* Domicile: Pekanbaru, Indonesia (UTC+7)
