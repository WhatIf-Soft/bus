# ADR-008: WebSocket — nhooyr/websocket + Native Browser API

## Status: Accepted

## Context

BusExpress requires real-time communication for two features: GPS tracking (live bus positions and dynamic ETA) and seat availability updates (reflecting locks/releases as users interact with the booking flow). The architecture specifies WebSocket as the primary channel with HTTP polling every 10 seconds as a fallback when the connection drops.

The primary alternative considered was Socket.io, which provides automatic reconnection, room-based broadcasting, and a unified client/server API.

## Decision

We chose **nhooyr/websocket** on the Go backend and the **native browser WebSocket API** on the frontend, wrapped in a custom `useWebSocket` React hook.

Key reasons:

- **Socket.io requires Node.js**: Socket.io's server component is a Node.js library. Integrating it into a Go backend would require either running a separate Node.js sidecar or using an unofficial Go port with limited maintenance. Both options add complexity and operational burden.
- **nhooyr/websocket is stdlib compatible**: nhooyr/websocket works with standard `net/http` handlers and the chi router (ADR-001). A WebSocket endpoint is just another `http.HandlerFunc`, keeping the architecture consistent.
- **Lightweight and well-maintained**: nhooyr/websocket has a small API surface, supports compression (permessage-deflate), and handles connection lifecycle cleanly.
- **Native browser API is sufficient**: The browser WebSocket API covers all BusExpress needs. Reconnection logic and fallback to HTTP polling are implemented in a `useWebSocket` hook, giving full control over retry behavior and fallback timing.

## Consequences

**Positive:**

- No additional runtime (Node.js) required. WebSocket endpoints run in the same Go process as REST endpoints.
- Consistent middleware stack — authentication, rate limiting, and logging middleware from chi apply to WebSocket upgrade requests.
- The `useWebSocket` hook encapsulates reconnection (exponential backoff) and automatic fallback to HTTP polling every 10 seconds, matching the spec requirement.
- Smaller dependency footprint compared to Socket.io's client and server libraries.

**Negative:**

- No built-in room/channel abstraction. Broadcasting to groups of clients (e.g., all users viewing a specific trip) must be implemented manually with a topic-based subscription registry.
- No automatic transport negotiation. The fallback from WebSocket to HTTP polling is explicit application logic in the `useWebSocket` hook, not a library feature.
- nhooyr/websocket does not provide a client-side library — the frontend relies on the browser's native API, which lacks built-in heartbeat/keepalive (must be implemented in the hook).
