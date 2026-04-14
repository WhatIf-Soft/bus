package websocket

import (
	"sync"
)

// Hub manages WebSocket client connections and message broadcasting per topic.
type Hub struct {
	clients    map[*Client]struct{}
	topics     map[string]map[*Client]struct{}
	register   chan *Client
	unregister chan *Client
	broadcast  chan topicMessage
	mu         sync.RWMutex
}

type topicMessage struct {
	topic   string
	message []byte
}

// NewHub creates a new Hub instance.
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]struct{}),
		topics:     make(map[string]map[*Client]struct{}),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan topicMessage, 256),
	}
}

// Register adds a client to the hub and subscribes it to its topics.
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister removes a client from the hub.
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// Broadcast sends a message to all clients subscribed to the given topic.
func (h *Hub) Broadcast(topic string, message []byte) {
	h.broadcast <- topicMessage{topic: topic, message: message}
}

// Run starts the hub event loop. It should be launched as a goroutine.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = struct{}{}
			for _, topic := range client.topics {
				if h.topics[topic] == nil {
					h.topics[topic] = make(map[*Client]struct{})
				}
				h.topics[topic][client] = struct{}{}
			}
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				for _, topic := range client.topics {
					delete(h.topics[topic], client)
					if len(h.topics[topic]) == 0 {
						delete(h.topics, topic)
					}
				}
				close(client.send)
			}
			h.mu.Unlock()

		case msg := <-h.broadcast:
			h.mu.RLock()
			if subscribers, ok := h.topics[msg.topic]; ok {
				for client := range subscribers {
					select {
					case client.send <- msg.message:
					default:
						go func(c *Client) {
							h.Unregister(c)
						}(client)
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}
