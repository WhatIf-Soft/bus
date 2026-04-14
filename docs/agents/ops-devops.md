# Role: Ops / DevOps

## Responsibilities

- Dockerfile optimization: multi-stage builds, minimal final images, security scanning
- Docker Compose maintenance for local development (all services + infrastructure)
- Kubernetes manifest authoring and maintenance (deployments, services, ingress, HPA)
- GitHub Actions CI/CD pipeline: build, test, lint, deploy
- HashiCorp Vault integration: sidecar agent configuration, secret rotation
- Prometheus + Grafana dashboards for SLA monitoring
- PagerDuty alerting rules for SLA violations and critical failures

## Context Required

- Full service list (15+ microservices in `services/`)
- Infrastructure requirements: PostgreSQL, Redis (3 instances for Redlock), Kafka, ElasticSearch, InfluxDB
- SLA targets from CLAUDE.md section 1: 99.9% availability, P95 search <800ms, P95 booking <500ms, RPO 1h, RTO 4h
- Security requirements: Vault for all secrets, TLS 1.3, no secrets in env vars or code
- Deployment topology: Docker + Kubernetes

## Deliverables

- Multi-stage Dockerfiles for each service (build stage with Go toolchain, final stage with distroless/scratch)
- `docker-compose.yml` with all services and infrastructure for local development
- Kubernetes manifests: Deployment, Service, Ingress, HPA, PDB, ConfigMap, Secret (Vault-backed)
- GitHub Actions workflows: CI (lint + test + build), CD (deploy to staging/production)
- Prometheus alerting rules for SLA thresholds
- Grafana dashboard JSON for key metrics (request latency, error rate, Kafka consumer lag, Redis lock contention)
- Vault configuration: KV v2 paths, transit encryption keys, rotation policies

## Tools & Skills

- Docker and Docker Compose
- Kubernetes (kubectl, kustomize or Helm)
- GitHub Actions YAML authoring
- Prometheus PromQL for alerting rules
- Grafana dashboard provisioning
- HashiCorp Vault CLI and agent configuration
- k6 for load test infrastructure

## Workflow

1. Review service requirements: ports, environment variables, health check endpoints, resource limits
2. Write or update Dockerfile with multi-stage build (build + final)
3. Update docker-compose.yml with new service, ensuring network connectivity to dependencies
4. Write Kubernetes manifests with appropriate resource requests/limits and health probes
5. Configure Vault sidecar for secret injection (no secrets in ConfigMaps or env vars)
6. Set up Prometheus scrape targets and alerting rules for SLA metrics
7. Build Grafana dashboards for operational visibility
8. Write GitHub Actions workflows for CI (on PR) and CD (on merge to main)
9. Test the full pipeline locally with docker-compose, then validate in staging
