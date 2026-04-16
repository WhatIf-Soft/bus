package http

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
)

// ConnectionHandler finds trips with one stopover (max 1 connection) per CLAUDE.md §5.2.
type ConnectionHandler struct {
	pool *pgxpool.Pool
}

// NewConnectionHandler constructs the handler.
func NewConnectionHandler(pool *pgxpool.Pool) *ConnectionHandler {
	return &ConnectionHandler{pool: pool}
}

// ConnectionLeg is one segment of a connected journey.
type ConnectionLeg struct {
	TripID          string  `json:"trip_id"`
	OperatorName    string  `json:"operator_name"`
	OriginCity      string  `json:"origin_city"`
	DestinationCity string  `json:"destination_city"`
	DepartureTime   string  `json:"departure_time"`
	ArrivalTime     string  `json:"arrival_time"`
	DurationMinutes int     `json:"duration_minutes"`
	PriceCents      int     `json:"price_cents"`
	AvailableSeats  int     `json:"available_seats"`
	BusClass        string  `json:"bus_class"`
}

// ConnectionResult is a full itinerary (2 legs).
type ConnectionResult struct {
	Legs            []ConnectionLeg `json:"legs"`
	TotalPriceCents int             `json:"total_price_cents"`
	TotalDuration   int             `json:"total_duration_minutes"`
	WaitMinutes     int             `json:"wait_minutes"`
}

// Search handles GET /api/v1/search/connections?origin=X&destination=Y&date=YYYY-MM-DD&passengers=N
func (h *ConnectionHandler) Search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	origin := q.Get("origin")
	dest := q.Get("destination")
	dateStr := q.Get("date")
	if origin == "" || dest == "" || dateStr == "" {
		response.Error(w, apperrors.NewValidation("origin, destination, date required"))
		return
	}
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid date"))
		return
	}
	passengers, _ := strconv.Atoi(q.Get("passengers"))
	if passengers <= 0 {
		passengers = 1
	}

	results, err := findConnections(r.Context(), h.pool, origin, dest, date, passengers)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{
		"connections": results,
		"count":       len(results),
	})
}

// findConnections queries for 1-stopover itineraries:
// leg1: origin → hub, leg2: hub → destination, with leg2 departing after leg1 arrives
// and a connection window of 30 min to 6 hours.
func findConnections(ctx context.Context, pool *pgxpool.Pool, origin, dest string, date time.Time, passengers int) ([]ConnectionResult, error) {
	const q = `
        WITH leg1 AS (
            SELECT t.id AS trip_id, o1.name AS op, os1.city AS orig, ds1.city AS hub,
                   t.departure_time, t.arrival_time, t.price_cents, t.available_seats,
                   t.bus_class,
                   EXTRACT(EPOCH FROM t.arrival_time - t.departure_time)::int / 60 AS dur
            FROM trips t
            JOIN routes r ON r.id = t.route_id
            JOIN stops os1 ON os1.id = r.origin_stop_id
            JOIN stops ds1 ON ds1.id = r.destination_stop_id
            JOIN operators o1 ON o1.id = t.operator_id
            WHERE LOWER(os1.city) = LOWER($1)
              AND LOWER(ds1.city) != LOWER($2)
              AND t.departure_time >= $3
              AND t.departure_time < $4
              AND t.status = 'scheduled'
              AND t.available_seats >= $5
        ),
        leg2 AS (
            SELECT t.id AS trip_id, o2.name AS op, os2.city AS orig, ds2.city AS dest,
                   t.departure_time, t.arrival_time, t.price_cents, t.available_seats,
                   t.bus_class,
                   EXTRACT(EPOCH FROM t.arrival_time - t.departure_time)::int / 60 AS dur
            FROM trips t
            JOIN routes r ON r.id = t.route_id
            JOIN stops os2 ON os2.id = r.origin_stop_id
            JOIN stops ds2 ON ds2.id = r.destination_stop_id
            JOIN operators o2 ON o2.id = t.operator_id
            WHERE LOWER(ds2.city) = LOWER($2)
              AND t.departure_time >= $3
              AND t.departure_time < ($4 + interval '1 day')
              AND t.status = 'scheduled'
              AND t.available_seats >= $5
        )
        SELECT
            l1.trip_id, l1.op, l1.orig, l1.hub,
            l1.departure_time, l1.arrival_time, l1.dur, l1.price_cents, l1.available_seats, l1.bus_class,
            l2.trip_id, l2.op, l2.orig, l2.dest,
            l2.departure_time, l2.arrival_time, l2.dur, l2.price_cents, l2.available_seats, l2.bus_class,
            EXTRACT(EPOCH FROM l2.departure_time - l1.arrival_time)::int / 60 AS wait
        FROM leg1 l1
        JOIN leg2 l2 ON LOWER(l1.hub) = LOWER(l2.orig)
            AND l2.departure_time >= l1.arrival_time + interval '30 minutes'
            AND l2.departure_time <= l1.arrival_time + interval '6 hours'
        ORDER BY (l1.price_cents + l2.price_cents), (l1.dur + l2.dur + EXTRACT(EPOCH FROM l2.departure_time - l1.arrival_time)::int / 60)
        LIMIT 20`

	nextDay := date.AddDate(0, 0, 1)
	rows, err := pool.Query(ctx, q, origin, dest, date, nextDay, passengers)
	if err != nil {
		return nil, fmt.Errorf("connection query: %w", err)
	}
	defer rows.Close()

	var results []ConnectionResult
	for rows.Next() {
		var l1, l2 ConnectionLeg
		var depTime1, arrTime1, depTime2, arrTime2 time.Time
		var wait int
		if err := rows.Scan(
			&l1.TripID, &l1.OperatorName, &l1.OriginCity, &l1.DestinationCity,
			&depTime1, &arrTime1, &l1.DurationMinutes, &l1.PriceCents, &l1.AvailableSeats, &l1.BusClass,
			&l2.TripID, &l2.OperatorName, &l2.OriginCity, &l2.DestinationCity,
			&depTime2, &arrTime2, &l2.DurationMinutes, &l2.PriceCents, &l2.AvailableSeats, &l2.BusClass,
			&wait,
		); err != nil {
			return nil, err
		}
		l1.DepartureTime = depTime1.Format(time.RFC3339)
		l1.ArrivalTime = arrTime1.Format(time.RFC3339)
		l2.DepartureTime = depTime2.Format(time.RFC3339)
		l2.ArrivalTime = arrTime2.Format(time.RFC3339)

		results = append(results, ConnectionResult{
			Legs:            []ConnectionLeg{l1, l2},
			TotalPriceCents: l1.PriceCents + l2.PriceCents,
			TotalDuration:   l1.DurationMinutes + wait + l2.DurationMinutes,
			WaitMinutes:     wait,
		})
	}
	if results == nil {
		results = []ConnectionResult{}
	}
	return results, rows.Err()
}
