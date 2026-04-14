'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ConnectionState = 'connected' | 'degraded' | 'disconnected';

type UseWebSocketOptions = {
  readonly url: string;
  readonly pollingUrl?: string;
  readonly pollingIntervalMs?: number;
  readonly maxReconnectAttempts?: number;
  readonly onMessage?: (data: unknown) => void;
};

type UseWebSocketReturn = {
  readonly state: ConnectionState;
  readonly sendMessage: (data: unknown) => void;
  readonly lastMessage: unknown;
};

const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const DEFAULT_POLLING_INTERVAL_MS = 10_000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5;

export function useWebSocket({
  url,
  pollingUrl,
  pollingIntervalMs = DEFAULT_POLLING_INTERVAL_MS,
  maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS,
  onMessage,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [state, setState] = useState<ConnectionState>('disconnected');
  const [lastMessage, setLastMessage] = useState<unknown>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!pollingUrl || pollingTimerRef.current) return;

    setState('degraded');
    pollingTimerRef.current = setInterval(async () => {
      try {
        const response = await fetch(pollingUrl);
        const data: unknown = await response.json();
        setLastMessage(data);
        onMessageRef.current?.(data);
      } catch {
        /* polling failure is silent — next interval retries */
      }
    }, pollingIntervalMs);
  }, [pollingUrl, pollingIntervalMs]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setState('connected');
        reconnectCountRef.current = 0;
        clearTimers();
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data: unknown = JSON.parse(String(event.data));
          setLastMessage(data);
          onMessageRef.current?.(data);
        } catch {
          /* ignore malformed messages */
        }
      };

      ws.onclose = () => {
        wsRef.current = null;

        if (reconnectCountRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            INITIAL_RECONNECT_DELAY_MS *
              Math.pow(2, reconnectCountRef.current),
            MAX_RECONNECT_DELAY_MS,
          );
          reconnectCountRef.current += 1;
          reconnectTimerRef.current = setTimeout(connect, delay);
        } else {
          startPolling();
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      startPolling();
    }
  }, [url, maxReconnectAttempts, clearTimers, startPolling]);

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      clearTimers();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect, clearTimers]);

  return { state, sendMessage, lastMessage };
}
