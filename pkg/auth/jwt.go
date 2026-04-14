package auth

import (
	"crypto/ed25519"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	apperrors "github.com/busexpress/pkg/errors"
)

// Claims holds the JWT claims for BusExpress tokens.
type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// TokenPair contains the access and refresh tokens.
type TokenPair struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
}

// GenerateTokenPair creates an access token (15 min) and refresh token (30 days)
// signed with HMAC-SHA256 using the provided secret.
// Note: For production RS256 with asymmetric keys, use GenerateTokenPairRS256.
func GenerateTokenPair(userID string, role string, secret []byte) (*TokenPair, error) {
	now := time.Now()
	accessExp := now.Add(15 * time.Minute)

	accessClaims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(accessExp),
			IssuedAt:  jwt.NewNumericDate(now),
			ID:        uuid.New().String(),
			Issuer:    "busexpress",
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessStr, err := accessToken.SignedString(secret)
	if err != nil {
		return nil, err
	}

	refreshExp := now.Add(30 * 24 * time.Hour)
	refreshClaims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(refreshExp),
			IssuedAt:  jwt.NewNumericDate(now),
			ID:        uuid.New().String(),
			Issuer:    "busexpress",
		},
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshStr, err := refreshToken.SignedString(secret)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessStr,
		RefreshToken: refreshStr,
		ExpiresAt:    accessExp,
	}, nil
}

// ValidateToken parses and validates a JWT token string using the given secret.
func ValidateToken(tokenString string, secret []byte) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, apperrors.NewUnauthorized("unexpected signing method")
		}
		return secret, nil
	})
	if err != nil {
		return nil, apperrors.NewUnauthorized("invalid or expired token")
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, apperrors.NewUnauthorized("invalid token claims")
	}

	return claims, nil
}

// GenerateTokenPairRS256 creates tokens signed with Ed25519 private key.
// This is the production-recommended approach for BusExpress (RS256/EdDSA).
func GenerateTokenPairRS256(userID string, role string, privateKey ed25519.PrivateKey) (*TokenPair, error) {
	now := time.Now()
	accessExp := now.Add(15 * time.Minute)

	accessClaims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(accessExp),
			IssuedAt:  jwt.NewNumericDate(now),
			ID:        uuid.New().String(),
			Issuer:    "busexpress",
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodEdDSA, accessClaims)
	accessStr, err := accessToken.SignedString(privateKey)
	if err != nil {
		return nil, err
	}

	refreshExp := now.Add(30 * 24 * time.Hour)
	refreshClaims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(refreshExp),
			IssuedAt:  jwt.NewNumericDate(now),
			ID:        uuid.New().String(),
			Issuer:    "busexpress",
		},
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodEdDSA, refreshClaims)
	refreshStr, err := refreshToken.SignedString(privateKey)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessStr,
		RefreshToken: refreshStr,
		ExpiresAt:    accessExp,
	}, nil
}
