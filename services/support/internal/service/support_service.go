package service

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/busexpress/services/support/internal/domain"
	"github.com/busexpress/services/support/internal/port"
)

type supportService struct {
	repo port.TicketRepository
}

// NewSupportService wires the application service.
func NewSupportService(repo port.TicketRepository) port.SupportService {
	return &supportService{repo: repo}
}

func (s *supportService) Create(ctx context.Context, req port.CreateTicketRequest) (*domain.Ticket, error) {
	if strings.TrimSpace(req.Body) == "" {
		return nil, domain.ErrEmptyMessage
	}
	if req.Category == "" {
		req.Category = domain.CategoryOther
	}
	if req.Priority == "" {
		req.Priority = domain.PriorityNormal
	}
	now := time.Now().UTC()
	t := &domain.Ticket{
		ID: uuid.New(), UserID: req.UserID, Subject: req.Subject,
		Category: req.Category, Priority: req.Priority, Status: domain.StatusOpen,
		BookingID: req.BookingID, CreatedAt: now, UpdatedAt: now,
	}
	initial := domain.Message{
		ID: uuid.New(), TicketID: t.ID, AuthorRole: domain.AuthorUser,
		AuthorID: req.UserID, Body: req.Body, CreatedAt: now,
	}
	if err := s.repo.CreateTicket(ctx, t, initial); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, t.ID)
}

func (s *supportService) Get(ctx context.Context, requesterID uuid.UUID, isAgent bool, id uuid.UUID) (*domain.Ticket, error) {
	t, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if !isAgent && t.UserID != requesterID {
		return nil, domain.ErrNotOwner
	}
	return t, nil
}

func (s *supportService) ListMine(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Ticket, int, error) {
	return s.repo.ListByUser(ctx, userID, limit, offset)
}

func (s *supportService) ListOpen(ctx context.Context, limit, offset int) ([]domain.Ticket, int, error) {
	return s.repo.ListOpen(ctx, limit, offset)
}

func (s *supportService) PostMessage(ctx context.Context, requesterID uuid.UUID, isAgent bool, ticketID uuid.UUID, body string) (*domain.Ticket, error) {
	body = strings.TrimSpace(body)
	if body == "" {
		return nil, domain.ErrEmptyMessage
	}
	t, err := s.repo.GetByID(ctx, ticketID)
	if err != nil {
		return nil, err
	}
	if !isAgent && t.UserID != requesterID {
		return nil, domain.ErrNotOwner
	}
	if t.Status == domain.StatusClosed {
		return nil, domain.ErrTicketClosed
	}
	role := domain.AuthorUser
	if isAgent {
		role = domain.AuthorAgent
	}
	m := &domain.Message{
		ID: uuid.New(), TicketID: ticketID, AuthorRole: role,
		AuthorID: requesterID, Body: body, CreatedAt: time.Now().UTC(),
	}
	if err := s.repo.AddMessage(ctx, m); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, ticketID)
}

func (s *supportService) UpdateStatus(ctx context.Context, requesterID uuid.UUID, isAgent bool, ticketID uuid.UUID, status domain.Status) (*domain.Ticket, error) {
	t, err := s.repo.GetByID(ctx, ticketID)
	if err != nil {
		return nil, err
	}
	// Voyageurs may only close their own ticket as 'resolved'.
	if !isAgent {
		if t.UserID != requesterID {
			return nil, domain.ErrNotOwner
		}
		if status != domain.StatusResolved && status != domain.StatusClosed {
			return nil, domain.ErrInvalidStatus
		}
	}
	if err := s.repo.UpdateStatus(ctx, ticketID, status, time.Now().UTC()); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, ticketID)
}

func (s *supportService) AssignAgent(ctx context.Context, ticketID, agentID uuid.UUID) (*domain.Ticket, error) {
	if err := s.repo.AssignAgent(ctx, ticketID, agentID); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, ticketID)
}
