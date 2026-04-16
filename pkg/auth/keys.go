package auth

import (
	"crypto/ed25519"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"
	"sync"

	"github.com/golang-jwt/jwt/v5"
)

// KeyPair holds the Ed25519 signing and verification keys.
type KeyPair struct {
	Private ed25519.PrivateKey
	Public  ed25519.PublicKey
}

var (
	devKeyOnce sync.Once
	devKeyPair *KeyPair
)

// LoadKeyPair loads an Ed25519 keypair from PEM files.
// If the files don't exist and `generateIfMissing` is true, a new keypair
// is generated and written to disk (suitable for local dev only).
func LoadKeyPair(privatePath, publicPath string, generateIfMissing bool) (*KeyPair, error) {
	privPEM, errP := os.ReadFile(privatePath)
	pubPEM, errPub := os.ReadFile(publicPath)

	if errP == nil && errPub == nil {
		return parseKeyPair(privPEM, pubPEM)
	}

	if !generateIfMissing {
		if errP != nil {
			return nil, fmt.Errorf("read private key: %w", errP)
		}
		return nil, fmt.Errorf("read public key: %w", errPub)
	}

	// Auto-generate for dev.
	kp, err := GenerateKeyPair()
	if err != nil {
		return nil, err
	}
	if err := writeKeyPair(kp, privatePath, publicPath); err != nil {
		return nil, err
	}
	return kp, nil
}

// GenerateKeyPair creates a fresh Ed25519 keypair in memory.
func GenerateKeyPair() (*KeyPair, error) {
	pub, priv, err := ed25519.GenerateKey(nil)
	if err != nil {
		return nil, fmt.Errorf("generate ed25519: %w", err)
	}
	return &KeyPair{Private: priv, Public: pub}, nil
}

// DevKeyPair returns a singleton ephemeral keypair for local development.
// The keypair lives only for the lifetime of the process.
func DevKeyPair() *KeyPair {
	devKeyOnce.Do(func() {
		kp, err := GenerateKeyPair()
		if err != nil {
			panic("dev keypair: " + err.Error())
		}
		devKeyPair = kp
	})
	return devKeyPair
}

// ValidateTokenEdDSA validates a token signed with EdDSA using the public key.
func ValidateTokenEdDSA(tokenString string, publicKey ed25519.PublicKey) (*Claims, error) {
	token, err := parseTokenWithKey(tokenString, publicKey)
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}
	return claims, nil
}

func parseKeyPair(privPEM, pubPEM []byte) (*KeyPair, error) {
	privBlock, _ := pem.Decode(privPEM)
	if privBlock == nil {
		return nil, fmt.Errorf("no PEM block in private key")
	}
	privKey, err := x509.ParsePKCS8PrivateKey(privBlock.Bytes)
	if err != nil {
		return nil, fmt.Errorf("parse private key: %w", err)
	}
	edPriv, ok := privKey.(ed25519.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("private key is not ed25519")
	}

	pubBlock, _ := pem.Decode(pubPEM)
	if pubBlock == nil {
		return nil, fmt.Errorf("no PEM block in public key")
	}
	pubKey, err := x509.ParsePKIXPublicKey(pubBlock.Bytes)
	if err != nil {
		return nil, fmt.Errorf("parse public key: %w", err)
	}
	edPub, ok := pubKey.(ed25519.PublicKey)
	if !ok {
		return nil, fmt.Errorf("public key is not ed25519")
	}

	return &KeyPair{Private: edPriv, Public: edPub}, nil
}

func writeKeyPair(kp *KeyPair, privatePath, publicPath string) error {
	privBytes, err := x509.MarshalPKCS8PrivateKey(kp.Private)
	if err != nil {
		return err
	}
	privPEM := pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: privBytes})
	if err := os.WriteFile(privatePath, privPEM, 0600); err != nil {
		return fmt.Errorf("write private key: %w", err)
	}

	pubBytes, err := x509.MarshalPKIXPublicKey(kp.Public)
	if err != nil {
		return err
	}
	pubPEM := pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: pubBytes})
	if err := os.WriteFile(publicPath, pubPEM, 0644); err != nil {
		return fmt.Errorf("write public key: %w", err)
	}
	return nil
}

// parseTokenWithKey uses jwt.Parse with EdDSA key func.
func parseTokenWithKey(tokenString string, publicKey ed25519.PublicKey) (*jwt.Token, error) {
	return jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodEd25519); ok {
			return publicKey, nil
		}
		return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
	})
}
