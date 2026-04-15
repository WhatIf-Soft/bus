package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/busexpress/services/search/internal/domain"
	"github.com/busexpress/services/search/internal/port"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type searchRepo struct {
	pool *pgxpool.Pool
}

// NewPostgresSearchRepository returns a new Postgres-backed SearchRepository.
func NewPostgresSearchRepository(pool *pgxpool.Pool) port.SearchRepository {
	return &searchRepo{pool: pool}
}

const tripSelect = `
SELECT
    t.id, t.route_id, t.operator_id, t.departure_time, t.arrival_time,
    t.price_cents, t.currency, t.total_seats, t.available_seats,
    t.bus_class, t.amenities, t.status,
    o.id, o.name, o.logo_url, o.rating, o.on_time_rate,
    os.id, os.name, os.city, os.country, os.latitude, os.longitude,
    ds.id, ds.name, ds.city, ds.country, ds.latitude, ds.longitude
FROM trips t
JOIN operators o ON o.id = t.operator_id
JOIN routes r ON r.id = t.route_id
JOIN stops os ON os.id = r.origin_stop_id
JOIN stops ds ON ds.id = r.destination_stop_id
`

func (r *searchRepo) SearchTrips(ctx context.Context, c domain.SearchCriteria) ([]domain.TripResult, int, error) {
	if c.Limit <= 0 {
		c.Limit = 20
	}
	if c.Limit > 100 {
		c.Limit = 100
	}

	where := []string{
		"LOWER(os.city) = LOWER($1)",
		"LOWER(ds.city) = LOWER($2)",
		"t.departure_time >= $3",
		"t.departure_time < $4",
		"t.status = 'scheduled'",
		"t.available_seats >= $5",
	}
	args := []any{
		c.OriginCity,
		c.DestinationCity,
		c.DepartureDate,
		c.DepartureDate.AddDate(0, 0, 1),
		c.Passengers,
	}
	i := 6
	if c.MaxPriceCents != nil {
		where = append(where, fmt.Sprintf("t.price_cents <= $%d", i))
		args = append(args, *c.MaxPriceCents)
		i++
	}
	if c.BusClass != nil && *c.BusClass != "" {
		where = append(where, fmt.Sprintf("t.bus_class = $%d", i))
		args = append(args, *c.BusClass)
		i++
	}

	whereSQL := strings.Join(where, " AND ")

	orderBy := "t.departure_time ASC"
	switch c.SortBy {
	case "price":
		orderBy = "t.price_cents ASC"
	case "duration":
		orderBy = "(t.arrival_time - t.departure_time) ASC"
	case "departure":
		orderBy = "t.departure_time ASC"
	case "recommended":
		// 40% price + 30% duration + 20% rating + 10% on-time
		orderBy = `
            (
                0.4 * (t.price_cents::float / 5000000.0)
              + 0.3 * (EXTRACT(EPOCH FROM t.arrival_time - t.departure_time) / 86400.0)
              + 0.2 * (1.0 - o.rating / 5.0)
              + 0.1 * (1.0 - o.on_time_rate)
            ) ASC`
	}

	countSQL := "SELECT COUNT(*) FROM trips t JOIN routes r ON r.id = t.route_id " +
		"JOIN stops os ON os.id = r.origin_stop_id " +
		"JOIN stops ds ON ds.id = r.destination_stop_id WHERE " + whereSQL

	var total int
	if err := r.pool.QueryRow(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count trips: %w", err)
	}

	query := tripSelect + " WHERE " + whereSQL + " ORDER BY " + orderBy +
		fmt.Sprintf(" LIMIT $%d OFFSET $%d", i, i+1)
	args = append(args, c.Limit, c.Offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query trips: %w", err)
	}
	defer rows.Close()

	out := make([]domain.TripResult, 0, c.Limit)
	for rows.Next() {
		tr, err := scanTripResult(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, tr)
	}
	return out, total, rows.Err()
}

func (r *searchRepo) AutocompleteStops(ctx context.Context, prefix string, limit int) ([]domain.Stop, error) {
	if limit <= 0 {
		limit = 10
	}
	q := `
        SELECT id, name, city, country, latitude, longitude
        FROM stops
        WHERE city ILIKE $1 OR name ILIKE $1
        ORDER BY
            CASE WHEN city ILIKE $2 THEN 0 ELSE 1 END,
            city
        LIMIT $3`
	rows, err := r.pool.Query(ctx, q, "%"+prefix+"%", prefix+"%", limit)
	if err != nil {
		return nil, fmt.Errorf("autocomplete: %w", err)
	}
	defer rows.Close()

	var out []domain.Stop
	for rows.Next() {
		var s domain.Stop
		if err := rows.Scan(&s.ID, &s.Name, &s.City, &s.Country, &s.Latitude, &s.Longitude); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r *searchRepo) GetTripByID(ctx context.Context, id uuid.UUID) (*domain.TripResult, error) {
	row := r.pool.QueryRow(ctx, tripSelect+" WHERE t.id = $1", id)
	tr, err := scanTripResult(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return &tr, nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanTripResult(row rowScanner) (domain.TripResult, error) {
	var tr domain.TripResult
	var amenitiesJSON []byte
	var logoURL *string
	err := row.Scan(
		&tr.Trip.ID, &tr.Trip.RouteID, &tr.Trip.OperatorID,
		&tr.Trip.DepartureTime, &tr.Trip.ArrivalTime,
		&tr.Trip.PriceCents, &tr.Trip.Currency,
		&tr.Trip.TotalSeats, &tr.Trip.AvailableSeats,
		&tr.Trip.BusClass, &amenitiesJSON, &tr.Trip.Status,
		&tr.Operator.ID, &tr.Operator.Name, &logoURL, &tr.Operator.Rating, &tr.Operator.OnTimeRate,
		&tr.Origin.ID, &tr.Origin.Name, &tr.Origin.City, &tr.Origin.Country, &tr.Origin.Latitude, &tr.Origin.Longitude,
		&tr.Destination.ID, &tr.Destination.Name, &tr.Destination.City, &tr.Destination.Country, &tr.Destination.Latitude, &tr.Destination.Longitude,
	)
	if err != nil {
		return tr, err
	}
	tr.Operator.LogoURL = logoURL
	if len(amenitiesJSON) > 0 {
		if err := json.Unmarshal(amenitiesJSON, &tr.Trip.Amenities); err != nil {
			return tr, fmt.Errorf("unmarshal amenities: %w", err)
		}
	}
	return tr, nil
}
