package http

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/busexpress/pkg/response"
)

// Handler implements the Africa's Talking USSD callback protocol.
// The AT gateway sends POST requests with form-encoded: sessionId, phoneNumber,
// networkCode, serviceCode, text.
// The server replies with plain text: "CON ..." for continuation or "END ..." for final.
//
// Menu structure:
//   "" (empty)       → main menu
//   "1"              → search routes
//   "1*Abidjan"      → pick origin, ask destination
//   "1*Abidjan*Lome" → show results summary
//   "2"              → check booking by phone
//   "3"              → contact support
type Handler struct {
	searchURL string
}

// NewHandler constructs the USSD handler.
func NewHandler(searchURL string) *Handler {
	return &Handler{searchURL: searchURL}
}

// Callback handles POST /api/v1/ussd/callback.
func (h *Handler) Callback(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		response.Error(w, fmt.Errorf("parse form: %w", err))
		return
	}

	text := r.FormValue("text")
	phone := r.FormValue("phoneNumber")
	parts := strings.Split(text, "*")

	var reply string
	switch {
	case text == "":
		reply = "CON Bienvenue sur BusExpress\n" +
			"1. Rechercher un trajet\n" +
			"2. Vérifier ma réservation\n" +
			"3. Contacter le support"

	case parts[0] == "1" && len(parts) == 1:
		reply = "CON Entrez la ville de départ:"

	case parts[0] == "1" && len(parts) == 2:
		reply = fmt.Sprintf("CON Départ: %s\nEntrez la ville d'arrivée:", parts[1])

	case parts[0] == "1" && len(parts) >= 3:
		origin := parts[1]
		dest := parts[2]
		reply = fmt.Sprintf(
			"END Recherche %s → %s\n"+
				"Consultez busexpress.dev ou appelez le 1234 pour réserver.\n"+
				"SMS de confirmation envoyé au %s.",
			origin, dest, phone,
		)

	case parts[0] == "2":
		if len(parts) == 1 {
			reply = "CON Entrez votre numéro de téléphone (ex: +22501020304):"
		} else {
			reply = fmt.Sprintf(
				"END Vérification pour %s...\n"+
					"Si vous avez une réservation, un SMS vous sera envoyé.",
				parts[1],
			)
		}

	case parts[0] == "3":
		reply = "END Support BusExpress:\n" +
			"Email: support@busexpress.dev\n" +
			"Tél: +225 01 02 03 04\n" +
			"Merci de votre confiance!"

	default:
		reply = "END Option invalide. Composez à nouveau le code USSD."
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprint(w, reply)
}
