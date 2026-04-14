# BusExpress

Bus reservation marketplace for West Africa.

## Tech Stack

- **Backend**: Go 1.23 microservices (15 services)
- **Frontend**: Next.js 15 PWA (mobile-first)
- **Database**: PostgreSQL + PostGIS
- **Cache**: Redis (Redlock for distributed locking)
- **Search**: ElasticSearch 8.x
- **Events**: Apache Kafka
- **Infrastructure**: Docker + Kubernetes

## Prerequisites

- Go 1.23+
- Node.js 22+
- pnpm 10+
- Docker & Docker Compose

## Quick Start

```bash
# Start infrastructure
make docker-up

# Run a backend service (e.g. user)
make dev SVC=user

# Run the frontend
cd web && pnpm dev
```

## Project Structure

```
bus/
├── pkg/                  # Shared Go libraries
├── services/             # 15 Go microservices
│   ├── user/
│   ├── search/
│   ├── booking/
│   ├── payment/
│   ├── ticket/
│   ├── notification/
│   ├── gps/
│   ├── operator/
│   ├── admin/
│   ├── review/
│   ├── waitlist/
│   ├── support/
│   ├── reconciliation/
│   ├── ussd/
│   └── gateway/
├── web/                  # Next.js 15 frontend
├── proto/                # Protocol Buffers
├── deploy/               # Deployment configs
├── docs/                 # Documentation
├── packages/             # Shared frontend packages
└── mobile/               # React Native app
```

## Documentation

- [CLAUDE.md](./CLAUDE.md) -- Project constitution and development rules
- [Specifications](./specifications_fonctionnelles_busexpress.md) -- Full functional specifications (v2.0)
