package crypto

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
)

// Sign computes an HMAC-SHA256 of data using the given key
// and returns the result as a hex-encoded string.
func Sign(data []byte, key []byte) string {
	mac := hmac.New(sha256.New, key)
	mac.Write(data)
	return hex.EncodeToString(mac.Sum(nil))
}

// Verify checks whether the hex-encoded signature matches the
// HMAC-SHA256 of data using the given key.
func Verify(data []byte, key []byte, signature string) bool {
	expected := Sign(data, key)
	return hmac.Equal([]byte(expected), []byte(signature))
}
