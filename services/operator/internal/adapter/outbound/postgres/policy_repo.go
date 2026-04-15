package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/busexpress/services/operator/internal/domain"
	"github.com/busexpress/services/operator/internal/port"
)

type policyRepo struct {
	pool *pgxpool.Pool
}

// NewPolicyRepository constructs a Postgres-backed policy repository.
func NewPolicyRepository(pool *pgxpool.Pool) port.PolicyRepository {
	return &policyRepo{pool: pool}
}

func (r *policyRepo) GetCancellation(ctx context.Context, opID uuid.UUID) (*domain.CancellationPolicy, error) {
	const q = `
        SELECT operator_id, refund_pct_24h, refund_pct_2_to_24h, refund_pct_under_2h, updated_at
        FROM cancellation_policies WHERE operator_id = $1`
	p := &domain.CancellationPolicy{}
	err := r.pool.QueryRow(ctx, q, opID).Scan(
		&p.OperatorID, &p.RefundPct24h, &p.RefundPct2to24h, &p.RefundPctUnder2h, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Spec defaults — CLAUDE.md §7.2.
			return &domain.CancellationPolicy{
				OperatorID:       opID,
				RefundPct24h:     100,
				RefundPct2to24h:  50,
				RefundPctUnder2h: 0,
			}, nil
		}
		return nil, err
	}
	return p, nil
}

func (r *policyRepo) UpsertCancellation(ctx context.Context, p *domain.CancellationPolicy) error {
	const q = `
        INSERT INTO cancellation_policies
            (operator_id, refund_pct_24h, refund_pct_2_to_24h, refund_pct_under_2h, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (operator_id) DO UPDATE SET
            refund_pct_24h = EXCLUDED.refund_pct_24h,
            refund_pct_2_to_24h = EXCLUDED.refund_pct_2_to_24h,
            refund_pct_under_2h = EXCLUDED.refund_pct_under_2h,
            updated_at = NOW()`
	_, err := r.pool.Exec(ctx, q,
		p.OperatorID, p.RefundPct24h, p.RefundPct2to24h, p.RefundPctUnder2h,
	)
	if err != nil {
		return fmt.Errorf("upsert cancellation policy: %w", err)
	}
	return nil
}

func (r *policyRepo) GetBaggage(ctx context.Context, opID uuid.UUID) (*domain.BaggagePolicy, error) {
	const q = `
        SELECT operator_id, free_kg, extra_fee_per_kg_cents, max_kg_per_passenger, updated_at
        FROM baggage_policies WHERE operator_id = $1`
	p := &domain.BaggagePolicy{}
	err := r.pool.QueryRow(ctx, q, opID).Scan(
		&p.OperatorID, &p.FreeKg, &p.ExtraFeePerKgCents, &p.MaxKgPerPassenger, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &domain.BaggagePolicy{
				OperatorID:         opID,
				FreeKg:             20,
				ExtraFeePerKgCents: 50000,
				MaxKgPerPassenger:  50,
			}, nil
		}
		return nil, err
	}
	return p, nil
}

func (r *policyRepo) UpsertBaggage(ctx context.Context, p *domain.BaggagePolicy) error {
	const q = `
        INSERT INTO baggage_policies
            (operator_id, free_kg, extra_fee_per_kg_cents, max_kg_per_passenger, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (operator_id) DO UPDATE SET
            free_kg = EXCLUDED.free_kg,
            extra_fee_per_kg_cents = EXCLUDED.extra_fee_per_kg_cents,
            max_kg_per_passenger = EXCLUDED.max_kg_per_passenger,
            updated_at = NOW()`
	_, err := r.pool.Exec(ctx, q,
		p.OperatorID, p.FreeKg, p.ExtraFeePerKgCents, p.MaxKgPerPassenger,
	)
	if err != nil {
		return fmt.Errorf("upsert baggage policy: %w", err)
	}
	return nil
}
