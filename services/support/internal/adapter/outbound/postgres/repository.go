package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/busexpress/services/support/internal/domain"
	"github.com/busexpress/services/support/internal/port"
)

type repo struct{ pool *pgxpool.Pool }

// NewPostgresTicketRepository constructs a Postgres-backed ticket repo.
func NewPostgresTicketRepository(pool *pgxpool.Pool) port.TicketRepository {
	return &repo{pool: pool}
}

func (r *repo) CreateTicket(ctx context.Context, t *domain.Ticket, initial domain.Message) error {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	const insertTicket = `
        INSERT INTO support_tickets
            (id, user_id, subject, category, priority, status, booking_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4::ticket_category, $5::ticket_priority, $6::ticket_status, $7, $8, $9)`
	if _, err := tx.Exec(ctx, insertTicket,
		t.ID, t.UserID, t.Subject, string(t.Category), string(t.Priority),
		string(t.Status), t.BookingID, t.CreatedAt, t.UpdatedAt,
	); err != nil {
		return fmt.Errorf("insert ticket: %w", err)
	}

	const insertMsg = `
        INSERT INTO support_messages
            (id, ticket_id, author_role, author_id, body, created_at)
        VALUES ($1, $2, $3::message_author, $4, $5, $6)`
	if _, err := tx.Exec(ctx, insertMsg,
		initial.ID, t.ID, string(initial.AuthorRole), initial.AuthorID,
		initial.Body, initial.CreatedAt,
	); err != nil {
		return fmt.Errorf("insert initial message: %w", err)
	}
	return tx.Commit(ctx)
}

func (r *repo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Ticket, error) {
	const q = `
        SELECT id, user_id, subject, category, priority, status, booking_id,
               assigned_agent_id, created_at, updated_at, closed_at
        FROM support_tickets WHERE id = $1`
	t := &domain.Ticket{}
	err := r.pool.QueryRow(ctx, q, id).Scan(
		&t.ID, &t.UserID, &t.Subject, &t.Category, &t.Priority, &t.Status,
		&t.BookingID, &t.AssignedAgentID, &t.CreatedAt, &t.UpdatedAt, &t.ClosedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrTicketNotFound
		}
		return nil, err
	}

	const msgQ = `
        SELECT id, ticket_id, author_role, author_id, body, created_at
        FROM support_messages WHERE ticket_id = $1 ORDER BY created_at`
	rows, err := r.pool.Query(ctx, msgQ, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var m domain.Message
		if err := rows.Scan(
			&m.ID, &m.TicketID, &m.AuthorRole, &m.AuthorID, &m.Body, &m.CreatedAt,
		); err != nil {
			return nil, err
		}
		t.Messages = append(t.Messages, m)
	}
	return t, rows.Err()
}

func (r *repo) ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Ticket, int, error) {
	if limit <= 0 {
		limit = 20
	}
	var total int
	if err := r.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM support_tickets WHERE user_id = $1", userID,
	).Scan(&total); err != nil {
		return nil, 0, err
	}
	const q = `
        SELECT id, user_id, subject, category, priority, status, booking_id,
               assigned_agent_id, created_at, updated_at, closed_at
        FROM support_tickets
        WHERE user_id = $1
        ORDER BY updated_at DESC
        LIMIT $2 OFFSET $3`
	rows, err := r.pool.Query(ctx, q, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := make([]domain.Ticket, 0, limit)
	for rows.Next() {
		var t domain.Ticket
		if err := rows.Scan(
			&t.ID, &t.UserID, &t.Subject, &t.Category, &t.Priority, &t.Status,
			&t.BookingID, &t.AssignedAgentID, &t.CreatedAt, &t.UpdatedAt, &t.ClosedAt,
		); err != nil {
			return nil, 0, err
		}
		out = append(out, t)
	}
	return out, total, rows.Err()
}

func (r *repo) ListOpen(ctx context.Context, limit, offset int) ([]domain.Ticket, int, error) {
	if limit <= 0 {
		limit = 50
	}
	var total int
	if err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM support_tickets
         WHERE status IN ('open', 'in_progress', 'awaiting_customer')`,
	).Scan(&total); err != nil {
		return nil, 0, err
	}
	const q = `
        SELECT id, user_id, subject, category, priority, status, booking_id,
               assigned_agent_id, created_at, updated_at, closed_at
        FROM support_tickets
        WHERE status IN ('open', 'in_progress', 'awaiting_customer')
        ORDER BY priority DESC, created_at
        LIMIT $1 OFFSET $2`
	rows, err := r.pool.Query(ctx, q, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := make([]domain.Ticket, 0, limit)
	for rows.Next() {
		var t domain.Ticket
		if err := rows.Scan(
			&t.ID, &t.UserID, &t.Subject, &t.Category, &t.Priority, &t.Status,
			&t.BookingID, &t.AssignedAgentID, &t.CreatedAt, &t.UpdatedAt, &t.ClosedAt,
		); err != nil {
			return nil, 0, err
		}
		out = append(out, t)
	}
	return out, total, rows.Err()
}

func (r *repo) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.Status, when time.Time) error {
	const q = `
        UPDATE support_tickets
        SET status = $1::ticket_status,
            updated_at = $2,
            closed_at = CASE WHEN $1 IN ('resolved', 'closed') THEN $2 ELSE closed_at END
        WHERE id = $3`
	tag, err := r.pool.Exec(ctx, q, string(status), when, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrTicketNotFound
	}
	return nil
}

func (r *repo) AssignAgent(ctx context.Context, id, agentID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE support_tickets
         SET assigned_agent_id = $1, status = 'in_progress', updated_at = NOW()
         WHERE id = $2`, agentID, id,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrTicketNotFound
	}
	return nil
}

func (r *repo) AddMessage(ctx context.Context, m *domain.Message) error {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	const insertMsg = `
        INSERT INTO support_messages
            (id, ticket_id, author_role, author_id, body, created_at)
        VALUES ($1, $2, $3::message_author, $4, $5, $6)`
	if _, err := tx.Exec(ctx, insertMsg,
		m.ID, m.TicketID, string(m.AuthorRole), m.AuthorID, m.Body, m.CreatedAt,
	); err != nil {
		return fmt.Errorf("insert message: %w", err)
	}

	// Bump ticket's updated_at and reflect awaiting_customer ↔ in_progress flip.
	var nextStatus string
	switch m.AuthorRole {
	case domain.AuthorAgent:
		nextStatus = "awaiting_customer"
	case domain.AuthorUser:
		nextStatus = "in_progress"
	}
	if nextStatus != "" {
		if _, err := tx.Exec(ctx, `
            UPDATE support_tickets
            SET status = $1::ticket_status, updated_at = NOW()
            WHERE id = $2 AND status NOT IN ('resolved', 'closed')`,
			nextStatus, m.TicketID,
		); err != nil {
			return fmt.Errorf("bump ticket status: %w", err)
		}
	}
	return tx.Commit(ctx)
}
