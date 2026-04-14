# Stage 1: Build
FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /build

# Copy shared pkg and service source
COPY pkg/ ./pkg/
COPY services/user/ ./services/user/

# Copy go.work for workspace-aware builds
COPY go.work ./

WORKDIR /build/services/user

RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /app/main ./cmd/server

# Stage 2: Run
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/main .
COPY --from=builder /build/services/user/migrations ./migrations

USER appuser

EXPOSE 4001

CMD ["./main", "serve"]
