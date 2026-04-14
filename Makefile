SERVICES = user search booking payment ticket notification gps operator admin review waitlist support reconciliation ussd gateway

.PHONY: build test lint fmt generate proto migrate docker-up docker-down dev test-integration coverage security pact-verify k6 web-dev web-build web-test web-lint

build:
	@for svc in $(SERVICES); do \
		echo "Building $$svc..."; \
		cd services/$$svc && go build -o ../../bin/$$svc ./cmd/server && cd ../..; \
	done

test:
	cd pkg && go test -race -coverprofile=coverage.out -covermode=atomic ./...
	@for svc in $(SERVICES); do \
		echo "Testing $$svc..."; \
		cd services/$$svc && go test -race -coverprofile=coverage.out -covermode=atomic ./... && cd ../..; \
	done

lint:
	golangci-lint run --config .golangci.yml ./...

fmt:
	gofumpt -l -w .

generate:
	cd pkg && go generate ./...
	@for svc in $(SERVICES); do \
		cd services/$$svc && go generate ./... && cd ../..; \
	done

proto:
	buf generate

migrate:
	migrate -path services/$(SVC)/migrations -database "$(DATABASE_URL)" up

docker-up:
	docker compose up -d

docker-down:
	docker compose down

dev:
	cd services/$(SVC) && air

test-integration:
	go test -race -tags=integration ./...

coverage:
	go tool cover -func=coverage.out

security:
	govulncheck ./...
	gosec ./...

pact-verify:
	@echo "TODO: implement pact verification"

k6:
	@echo "TODO: implement k6 load tests"

web-dev:
	cd web && pnpm dev

web-build:
	cd web && pnpm build

web-test:
	cd web && pnpm test

web-lint:
	cd web && pnpm lint
