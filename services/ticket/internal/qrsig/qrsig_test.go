package qrsig

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

var testSecret = []byte("test-qr-secret-key-32-bytes-long")

func testPayload() Payload {
	return Payload{
		TicketID:  uuid.New(),
		BookingID: uuid.New(),
		SeatID:    "3A",
		TripID:    uuid.New(),
		Passenger: "Alice Doe",
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}
}

func TestSignVerifyRoundtrip(t *testing.T) {
	p := testPayload()
	encoded, err := Encode(testSecret, p)
	if err != nil {
		t.Fatal(err)
	}
	if encoded == "" {
		t.Fatal("encoded string is empty")
	}

	decoded, err := Decode(testSecret, encoded)
	if err != nil {
		t.Fatalf("decode: %v", err)
	}
	if decoded.TicketID != p.TicketID {
		t.Fatalf("ticket id mismatch: %s != %s", decoded.TicketID, p.TicketID)
	}
	if decoded.SeatID != p.SeatID {
		t.Fatalf("seat id mismatch: %s != %s", decoded.SeatID, p.SeatID)
	}
	if decoded.Passenger != p.Passenger {
		t.Fatalf("passenger mismatch: %s != %s", decoded.Passenger, p.Passenger)
	}
}

func TestTamperDetection(t *testing.T) {
	p := testPayload()
	encoded, _ := Encode(testSecret, p)

	// Corrupt one byte in the payload portion.
	corrupted := []byte(encoded)
	if len(corrupted) > 5 {
		corrupted[3] ^= 0xFF
	}

	_, err := Decode(testSecret, string(corrupted))
	if err == nil {
		t.Fatal("expected error on tampered payload")
	}
}

func TestWrongSecret(t *testing.T) {
	p := testPayload()
	encoded, _ := Encode(testSecret, p)

	_, err := Decode([]byte("wrong-secret-key-xxxxxxxxxx"), encoded)
	if err == nil {
		t.Fatal("expected error with wrong secret")
	}
}

func TestMalformedPayload(t *testing.T) {
	cases := []string{
		"",
		"no-dot-separator",
		".empty-payload",
		"empty-signature.",
	}
	for _, tc := range cases {
		_, err := Decode(testSecret, tc)
		if err == nil {
			t.Fatalf("expected error for %q", tc)
		}
	}
}

func TestExpiredPayload(t *testing.T) {
	p := testPayload()
	p.ExpiresAt = time.Now().Add(-1 * time.Hour)
	encoded, _ := Encode(testSecret, p)

	decoded, err := Decode(testSecret, encoded)
	if err != nil {
		t.Fatalf("decode should succeed (expiry is caller's responsibility): %v", err)
	}
	if !decoded.ExpiresAt.Before(time.Now()) {
		t.Fatal("expected expired timestamp")
	}
}

func TestMultipleSignaturesUnique(t *testing.T) {
	p1 := testPayload()
	p2 := testPayload()

	enc1, _ := Encode(testSecret, p1)
	enc2, _ := Encode(testSecret, p2)

	if enc1 == enc2 {
		t.Fatal("different payloads should produce different encoded strings")
	}
}
