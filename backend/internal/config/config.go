package config

import (
	"os"
	"strings"
)

type ProviderConfig struct {
	ID        string
	Name      string
	OriginURL string
	Hosts     []string
	APIBase   string
	Domain    string
	Headers   map[string]string
}

type Config struct {
	Providers map[string]ProviderConfig
	ordered   []string
}

func (c Config) ProviderIDs() []string {
	if len(c.ordered) > 0 {
		out := make([]string, len(c.ordered))
		copy(out, c.ordered)
		return out
	}

	ids := make([]string, 0, len(c.Providers))
	for id := range c.Providers {
		ids = append(ids, id)
	}
	return ids
}

func (c Config) ProviderByID(id string) (ProviderConfig, bool) {
	p, ok := c.Providers[id]
	return p, ok
}

func (c Config) DefaultProviderID() string {
	if len(c.ordered) > 0 {
		return c.ordered[0]
	}
	for id := range c.Providers {
		return id
	}
	return ""
}

func Load() Config {
	providers := map[string]ProviderConfig{
		"verge": {
			ID:        "verge",
			Name:      "VergeCloud",
			OriginURL: envOr("VERGE_ORIGIN_URL", "https://test-verge-test.shop"),
			Hosts:     []string{"test-verge-test.shop", "www.test-verge-test.shop"},
			APIBase:   trim(envOr("VERGE_API_BASE", "https://api.vergecloud.com/v1")),
			Domain:    envOr("VERGE_DOMAIN", ""),
			Headers: map[string]string{
				"X-API-Key":    envOr("VERGE_TOKEN", ""),
				"Content-Type": "application/json",
			},
		},
		"arvan": {
			ID:        "arvan",
			Name:      "ArvanCloud",
			OriginURL: envOr("ARVAN_ORIGIN_URL", "https://test20250316.ir"),
			Hosts:     []string{"test20250316.ir", "www.test20250316.ir"},
			APIBase:   trim(envOr("ARVAN_API_BASE", "https://napi.arvancloud.ir/cdn/4.0")),
			Domain:    envOr("ARVAN_DOMAIN", ""),
			Headers: map[string]string{
				"Authorization": "apikey " + envOr("ARVAN_TOKEN", ""),
				"Content-Type":  "application/json",
			},
		},
	}

	order := []string{"verge", "arvan"}

	return Config{
		Providers: providers,
		ordered:   order,
	}
}

func envOr(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func trim(input string) string {
	return strings.TrimRight(strings.TrimSpace(input), "/")
}
