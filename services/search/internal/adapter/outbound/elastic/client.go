// Package elastic provides ElasticSearch integration for the search-service.
// In Phase 1 the service used Postgres full-text (pg_trgm) which remains the
// fallback. This package adds BM25-scored search via ES 8.x per CLAUDE.md §2.
package elastic

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client wraps basic ES operations for trip search.
type Client struct {
	baseURL string
	http    *http.Client
}

// NewClient creates an ES client. If baseURL is empty, all operations no-op.
func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		http:    &http.Client{Timeout: 5 * time.Second},
	}
}

// Enabled reports whether ElasticSearch is configured.
func (c *Client) Enabled() bool {
	return c.baseURL != ""
}

// TripDoc is the document shape indexed into ES.
type TripDoc struct {
	TripID          string   `json:"trip_id"`
	OriginCity      string   `json:"origin_city"`
	DestinationCity string   `json:"destination_city"`
	OperatorName    string   `json:"operator_name"`
	DepartureTime   string   `json:"departure_time"`
	ArrivalTime     string   `json:"arrival_time"`
	PriceCents      int      `json:"price_cents"`
	AvailableSeats  int      `json:"available_seats"`
	BusClass        string   `json:"bus_class"`
	Amenities       []string `json:"amenities"`
	Rating          float64  `json:"rating"`
}

const indexName = "busexpress-trips"

// EnsureIndex creates the index with the mapping if it doesn't exist.
func (c *Client) EnsureIndex(ctx context.Context) error {
	if !c.Enabled() {
		return nil
	}
	mapping := map[string]any{
		"mappings": map[string]any{
			"properties": map[string]any{
				"origin_city":      map[string]string{"type": "text", "analyzer": "standard"},
				"destination_city": map[string]string{"type": "text", "analyzer": "standard"},
				"operator_name":    map[string]string{"type": "text"},
				"departure_time":   map[string]string{"type": "date"},
				"arrival_time":     map[string]string{"type": "date"},
				"price_cents":      map[string]string{"type": "integer"},
				"available_seats":  map[string]string{"type": "integer"},
				"bus_class":        map[string]string{"type": "keyword"},
				"rating":           map[string]string{"type": "float"},
			},
		},
	}
	body, _ := json.Marshal(mapping)
	req, err := http.NewRequestWithContext(ctx, http.MethodPut,
		fmt.Sprintf("%s/%s", c.baseURL, indexName), bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("create index: %w", err)
	}
	defer resp.Body.Close()
	// 200 = created, 400 = already exists — both OK.
	return nil
}

// IndexTrip upserts a trip document.
func (c *Client) IndexTrip(ctx context.Context, doc TripDoc) error {
	if !c.Enabled() {
		return nil
	}
	body, _ := json.Marshal(doc)
	url := fmt.Sprintf("%s/%s/_doc/%s", c.baseURL, indexName, doc.TripID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPut, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("index trip: %w", err)
	}
	defer resp.Body.Close()
	_, _ = io.ReadAll(resp.Body)
	return nil
}

// SearchResult is one hit from ES.
type SearchResult struct {
	TripID string  `json:"trip_id"`
	Score  float64 `json:"_score"`
}

// Search performs a BM25 query across origin + destination + operator fields.
func (c *Client) Search(ctx context.Context, query string, limit int) ([]SearchResult, error) {
	if !c.Enabled() {
		return nil, nil
	}
	if limit <= 0 {
		limit = 20
	}
	body := map[string]any{
		"size": limit,
		"query": map[string]any{
			"multi_match": map[string]any{
				"query":  query,
				"fields": []string{"origin_city^2", "destination_city^2", "operator_name"},
			},
		},
	}
	buf, _ := json.Marshal(body)
	url := fmt.Sprintf("%s/%s/_search", c.baseURL, indexName)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(buf))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("es search: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Hits struct {
			Hits []struct {
				ID     string  `json:"_id"`
				Score  float64 `json:"_score"`
				Source TripDoc `json:"_source"`
			} `json:"hits"`
		} `json:"hits"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	out := make([]SearchResult, 0, len(result.Hits.Hits))
	for _, h := range result.Hits.Hits {
		out = append(out, SearchResult{TripID: h.Source.TripID, Score: h.Score})
	}
	return out, nil
}
