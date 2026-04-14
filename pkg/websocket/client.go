package websocket

import (
	"context"
	"time"

	ws "nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
	maxMsgSize = 512 * 1024 // 512 KB
)

// Client represents a single WebSocket connection.
type Client struct {
	conn   *ws.Conn
	hub    *Hub
	topics []string
	send   chan []byte
}

// NewClient creates a new WebSocket client.
func NewClient(conn *ws.Conn, hub *Hub, topics []string) *Client {
	return &Client{
		conn:   conn,
		hub:    hub,
		topics: topics,
		send:   make(chan []byte, 256),
	}
}

// ReadPump reads messages from the WebSocket connection.
// It should be run as a goroutine. When the connection closes,
// the client is unregistered from the hub.
func (c *Client) ReadPump(ctx context.Context) {
	defer func() {
		c.hub.Unregister(c)
		_ = c.conn.Close(ws.StatusNormalClosure, "closing")
	}()

	c.conn.SetReadLimit(maxMsgSize)

	for {
		var msg []byte
		if err := wsjson.Read(ctx, c.conn, &msg); err != nil {
			break
		}
	}
}

// WritePump writes messages from the send channel to the WebSocket connection.
// It also sends periodic pings to keep the connection alive.
// It should be run as a goroutine.
func (c *Client) WritePump(ctx context.Context) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		_ = c.conn.Close(ws.StatusNormalClosure, "closing")
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				_ = c.conn.Close(ws.StatusNormalClosure, "closing")
				return
			}

			writeCtx, cancel := context.WithTimeout(ctx, writeWait)
			err := c.conn.Write(writeCtx, ws.MessageText, message)
			cancel()
			if err != nil {
				return
			}

		case <-ticker.C:
			pingCtx, cancel := context.WithTimeout(ctx, writeWait)
			err := c.conn.Ping(pingCtx)
			cancel()
			if err != nil {
				return
			}

		case <-ctx.Done():
			return
		}
	}
}
