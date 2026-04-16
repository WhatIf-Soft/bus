package http

import (
	"bytes"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jung-kurt/gofpdf"

	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
	"github.com/busexpress/services/payment/internal/domain"
)

// Invoice handles GET /api/v1/payments/{id}/invoice.pdf
func (h *Handler) Invoice(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid payment id"))
		return
	}
	p, err := h.service.GetByID(r.Context(), userID, id)
	if err != nil {
		mapError(w, err)
		return
	}
	if p.Status != domain.StatusSucceeded && p.Status != domain.StatusRefunded {
		response.Error(w, apperrors.NewConflict("invoice only available for completed payments"))
		return
	}

	pdfBytes, err := renderInvoice(p)
	if err != nil {
		response.Error(w, fmt.Errorf("render invoice: %w", err))
		return
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition",
		fmt.Sprintf(`inline; filename="invoice-%s.pdf"`, id.String()[:8]))
	_, _ = w.Write(pdfBytes)
}

func renderInvoice(p *domain.Payment) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Header
	pdf.SetFont("Arial", "B", 20)
	pdf.Cell(0, 12, "BusExpress")
	pdf.Ln(12)
	pdf.SetFont("Arial", "", 9)
	pdf.Cell(0, 5, "Facture / Invoice")
	pdf.Ln(10)

	// Invoice meta
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(90, 6, fmt.Sprintf("N° Facture : %s", p.ID.String()[:13]))
	pdf.Cell(0, 6, fmt.Sprintf("Date : %s", p.CreatedAt.Format("02/01/2006")))
	pdf.Ln(6)
	pdf.Cell(90, 6, fmt.Sprintf("Réservation : %s", p.BookingID.String()[:13]))
	pdf.Cell(0, 6, fmt.Sprintf("Méthode : %s", p.Method))
	pdf.Ln(6)
	if p.ExternalRef != nil {
		pdf.Cell(0, 6, fmt.Sprintf("Réf. externe : %s", *p.ExternalRef))
		pdf.Ln(6)
	}
	pdf.Ln(6)

	// Table header
	pdf.SetFont("Arial", "B", 10)
	pdf.SetFillColor(240, 240, 240)
	pdf.CellFormat(90, 8, "Description", "1", 0, "", true, 0, "")
	pdf.CellFormat(40, 8, "Montant", "1", 0, "R", true, 0, "")
	pdf.CellFormat(40, 8, "Devise", "1", 0, "C", true, 0, "")
	pdf.Ln(8)

	// Row
	pdf.SetFont("Arial", "", 10)
	amount := float64(p.AmountCents) / 100
	pdf.CellFormat(90, 8, "Réservation de bus", "1", 0, "", false, 0, "")
	pdf.CellFormat(40, 8, fmt.Sprintf("%.0f", amount), "1", 0, "R", false, 0, "")
	pdf.CellFormat(40, 8, p.Currency, "1", 0, "C", false, 0, "")
	pdf.Ln(8)

	// Total
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(90, 8, "Total TTC", "1", 0, "", true, 0, "")
	pdf.CellFormat(40, 8, fmt.Sprintf("%.0f", amount), "1", 0, "R", true, 0, "")
	pdf.CellFormat(40, 8, p.Currency, "1", 0, "C", true, 0, "")
	pdf.Ln(8)

	// Status
	pdf.Ln(8)
	pdf.SetFont("Arial", "", 9)
	pdf.Cell(0, 5, fmt.Sprintf("Statut : %s", p.Status))
	pdf.Ln(5)
	if p.CompletedAt != nil {
		pdf.Cell(0, 5, fmt.Sprintf("Complété le : %s", p.CompletedAt.Format(time.RFC3339)))
	}
	if p.Status == domain.StatusRefunded {
		pdf.Ln(5)
		pdf.SetTextColor(180, 0, 0)
		pdf.Cell(0, 5, "Ce paiement a été remboursé.")
	}

	// Footer
	pdf.Ln(20)
	pdf.SetTextColor(128, 128, 128)
	pdf.SetFont("Arial", "", 8)
	pdf.Cell(0, 4, "BusExpress — Marketplace de réservation de bus en ligne pour l'Afrique de l'Ouest")
	pdf.Ln(4)
	pdf.Cell(0, 4, "Ce document fait office de facture. Conservez-le pour vos records.")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
