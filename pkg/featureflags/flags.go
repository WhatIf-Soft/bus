// Package featureflags provides a simple feature toggle system.
// In production, wire to Unleash or LaunchDarkly via the Provider interface.
// For MVP, uses a static in-memory map loaded from config/env.
package featureflags

import (
	"sync"
)

// Provider abstracts the feature flag backend.
type Provider interface {
	IsEnabled(flag string) bool
}

// StaticProvider holds flags in memory. Thread-safe.
type StaticProvider struct {
	mu    sync.RWMutex
	flags map[string]bool
}

// NewStaticProvider creates a provider from a map of flag→enabled.
func NewStaticProvider(flags map[string]bool) *StaticProvider {
	cp := make(map[string]bool, len(flags))
	for k, v := range flags {
		cp[k] = v
	}
	return &StaticProvider{flags: cp}
}

// IsEnabled reports whether a flag is on. Unknown flags default to false.
func (p *StaticProvider) IsEnabled(flag string) bool {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.flags[flag]
}

// Set changes a flag at runtime (for dev/testing).
func (p *StaticProvider) Set(flag string, enabled bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.flags[flag] = enabled
}

// Well-known flag names used across BusExpress services.
const (
	FlagDynamicPricing  = "dynamic_pricing"
	FlagFraudDetection  = "fraud_detection"
	FlagLoyaltyBonus    = "loyalty_bonus"
	FlagWaitlistFIFO    = "waitlist_fifo"
	FlagElasticSearch   = "elasticsearch"
	FlagKafkaEvents     = "kafka_events"
	FlagGPSTracking     = "gps_tracking"
	FlagUSSD            = "ussd"
	FlagChatbot         = "chatbot"
	FlagB2BAPI          = "b2b_api"
	FlagTicketTransfer  = "ticket_transfer"
	FlagPriceAlerts     = "price_alerts"
	FlagMultiAgency     = "multi_agency"
	FlagReferral        = "referral"
)

// DefaultFlags returns the default flag set for Phase 1+2 (all MVP features on).
func DefaultFlags() map[string]bool {
	return map[string]bool{
		FlagDynamicPricing: false,
		FlagFraudDetection: false,
		FlagLoyaltyBonus:   true,
		FlagWaitlistFIFO:   true,
		FlagElasticSearch:  false,
		FlagKafkaEvents:    false,
		FlagGPSTracking:    true,
		FlagUSSD:           true,
		FlagChatbot:        true,
		FlagB2BAPI:         true,
		FlagTicketTransfer: true,
		FlagPriceAlerts:    true,
		FlagMultiAgency:    true,
		FlagReferral:       true,
	}
}
