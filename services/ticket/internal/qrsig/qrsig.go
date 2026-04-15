// Package qrsig generates and verifies HMAC-SHA256 signatures embedded in
// ticket QR codes. Per CLAUDE.md §7.3, the signature key MUST rotate daily.
package qrsig

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// Payload is the JSON object encoded inside the QR code.
// Its fields are echoed in plaintext beside the signature so a scanner
// can re-derive the HMAC and compare it.
type Payload struct {
	TicketID  uuid.UUID `json:"tid"`
	BookingID uuid.UUID `json:"bid"`
	SeatID    string    `json:"seat"`
	TripID    uuid.UUID `json:"trip"`
	Passenger string    `json:"name"`
	ExpiresAt time.Time `json:"exp"`
}

// Sign produces a base64-url-encoded HMAC-SHA256 signature over the canonical
// JSON encoding of `p`.
func Sign(secret []byte, p Payload) (string, error) {
	canonical, err := canonicalise(p)
	if err != nil {
		return "", err
	}
	mac := hmac.New(sha256.New, secret)
	mac.Write(canonical)
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil)), nil
}

// Encode returns the full QR string in the form "<base64-payload>.<signature>".
func Encode(secret []byte, p Payload) (string, error) {
	canonical, err := canonicalise(p)
	if err != nil {
		return "", err
	}
	sig, err := Sign(secret, p)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s.%s", base64.RawURLEncoding.EncodeToString(canonical), sig), nil
}

// Decode verifies the signature and returns the parsed payload.
func Decode(secret []byte, encoded string) (*Payload, error) {
	dot := -1
	for i := len(encoded) - 1; i >= 0; i-- {
		if encoded[i] == '.' {
			dot = i
			break
		}
	}
	if dot <= 0 || dot == len(encoded)-1 {
		return nil, fmt.Errorf("malformed QR payload")
	}
	payloadB64 := encoded[:dot]
	sig := encoded[dot+1:]

	canonical, err := base64.RawURLEncoding.DecodeString(payloadB64)
	if err != nil {
		return nil, fmt.Errorf("decode payload: %w", err)
	}

	mac := hmac.New(sha256.New, secret)
	mac.Write(canonical)
	expected := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(expected), []byte(sig)) {
		return nil, fmt.Errorf("invalid signature")
	}

	var p Payload
	if err := json.Unmarshal(canonical, &p); err != nil {
		return nil, fmt.Errorf("unmarshal payload: %w", err)
	}
	return &p, nil
}

func canonicalise(p Payload) ([]byte, error) {
	return json.Marshal(p)
}
