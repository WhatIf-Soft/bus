package http

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/busexpress/pkg/response"
)

// ChatbotHandler provides a rule-based FAQ chatbot (CLAUDE.md §10 Phase 2).
// Production wiring connects to an LLM or NLU pipeline; this MVP uses keyword matching.
type ChatbotHandler struct{}

// NewChatbotHandler constructs the handler.
func NewChatbotHandler() *ChatbotHandler { return &ChatbotHandler{} }

// ChatRequest is the body for POST /api/v1/support/chat.
type ChatRequest struct {
	Message string `json:"message"`
}

// ChatResponse is the bot's reply.
type ChatResponse struct {
	Reply      string   `json:"reply"`
	Suggestions []string `json:"suggestions,omitempty"`
}

var faq = []struct {
	keywords []string
	reply    string
}{
	{[]string{"annul", "cancel", "rembours", "refund"}, "Pour annuler une réservation, rendez-vous dans Mes Réservations et cliquez « Annuler ». Le remboursement dépend du délai avant le départ :\n• Plus de 24h : 100%\n• 2h à 24h : 50%\n• Moins de 2h : 0%\nCes pourcentages sont configurables par l'opérateur."},
	{[]string{"bagage", "baggage", "valise"}, "Chaque passager dispose d'une franchise bagage gratuite (en général 20 kg). Un supplément s'applique au-delà. Le montant dépend de l'opérateur."},
	{[]string{"paiement", "payer", "mobile money", "orange", "wave", "mtn", "moov", "carte"}, "BusExpress accepte : carte bancaire (Visa, Mastercard), Orange Money, Wave, MTN MoMo, et Moov Money. Le paiement Mobile Money prend 1 à 5 minutes pour confirmation."},
	{[]string{"billet", "ticket", "qr", "pdf"}, "Vos billets sont disponibles dans la page de votre réservation une fois le paiement confirmé. Chaque billet contient un QR code unique pour l'embarquement. Vous pouvez le télécharger en PDF."},
	{[]string{"transfer", "transfert", "changer nom"}, "Vous pouvez transférer votre billet à un autre passager depuis la page de détails du billet. Le QR code sera régénéré avec le nouveau nom."},
	{[]string{"operat", "compagn"}, "BusExpress travaille avec plusieurs opérateurs de bus en Afrique de l'Ouest. Chaque opérateur fixe ses propres tarifs, politiques d'annulation et de bagages."},
	{[]string{"inscription", "register", "compte", "account"}, "Créez un compte avec votre email sur la page d'inscription. Vous pouvez aussi utiliser Google, Facebook ou Apple pour vous inscrire."},
	{[]string{"horaire", "heure", "depart"}, "Les horaires varient selon la ligne et l'opérateur. Recherchez votre trajet depuis la page d'accueil pour voir tous les départs disponibles."},
	{[]string{"2fa", "securit", "two factor"}, "Pour activer la vérification en deux étapes, allez dans Mon Compte > Sécurité > Activer 2FA. Vous aurez besoin d'une application d'authentification (Google Authenticator, etc.)."},
	{[]string{"fidel", "loyalty", "point"}, "Gagnez des points de fidélité à chaque réservation confirmée. Invitez vos amis avec votre code de parrainage pour obtenir des points bonus !"},
	{[]string{"list", "attente", "waitlist"}, "Si un trajet est complet, vous pouvez rejoindre la liste d'attente. Vous serez notifié dès qu'une place se libère et aurez 15 minutes pour confirmer."},
}

var defaultReply = ChatResponse{
	Reply: "Je n'ai pas compris votre question. Voici ce que je peux vous aider à faire :",
	Suggestions: []string{
		"Comment annuler une réservation ?",
		"Quels modes de paiement acceptez-vous ?",
		"Comment transférer un billet ?",
		"Quelle est la politique bagages ?",
		"Comment activer la 2FA ?",
	},
}

// Chat handles POST /api/v1/support/chat.
func (h *ChatbotHandler) Chat(w http.ResponseWriter, r *http.Request) {
	var req ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.JSON(w, http.StatusOK, defaultReply)
		return
	}

	msg := strings.ToLower(req.Message)
	for _, f := range faq {
		for _, kw := range f.keywords {
			if strings.Contains(msg, kw) {
				response.JSON(w, http.StatusOK, ChatResponse{Reply: f.reply})
				return
			}
		}
	}
	response.JSON(w, http.StatusOK, defaultReply)
}
