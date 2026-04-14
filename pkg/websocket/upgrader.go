package websocket

import (
	"net/http"
	"strings"

	ws "nhooyr.io/websocket"
)

// UpgradeHandler returns an HTTP handler that upgrades the connection
// to WebSocket using nhooyr.io/websocket and registers the client with the hub.
// Topics are read from the "topics" query parameter (comma-separated).
func UpgradeHandler(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := ws.Accept(w, r, &ws.AcceptOptions{
			InsecureSkipVerify: false,
		})
		if err != nil {
			http.Error(w, "websocket upgrade failed", http.StatusBadRequest)
			return
		}

		topicParam := r.URL.Query().Get("topics")
		var topics []string
		if topicParam != "" {
			topics = strings.Split(topicParam, ",")
		}

		client := NewClient(conn, hub, topics)
		hub.Register(client)

		ctx := r.Context()
		go client.WritePump(ctx)
		go client.ReadPump(ctx)
	}
}
