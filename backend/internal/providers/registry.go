package providers

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/mehrdad/project/training/cloud/Test-CDN/backend/internal/config"
)

type Registry struct {
	configs map[string]config.ProviderConfig
	client  *http.Client
}

func NewRegistry(cfg config.Config) *Registry {
	return &Registry{
		configs: cfg.Providers,
		client:  &http.Client{Timeout: 30 * time.Second},
	}
}

func (r *Registry) Call(providerID, resource string) ([]byte, int, error) {
	provider, ok := r.configs[providerID]
	if !ok {
		return nil, 0, fmt.Errorf("unknown provider: %s", providerID)
	}

	endpoint, err := resolveEndpoint(provider, resource)
	if err != nil {
		return nil, 0, err
	}

	url := provider.APIBase + ensureLeadingSlash(endpoint)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, 0, err
	}

	for k, v := range provider.Headers {
		if v != "" {
			req.Header.Set(k, v)
		}
	}

	resp, err := r.client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	return body, resp.StatusCode, err
}

func resolveEndpoint(provider config.ProviderConfig, resource string) (string, error) {
	path := strings.Trim(strings.TrimSpace(resource), "/")
	if path == "" {
		return "", errors.New("missing resource")
	}

	switch provider.ID {
	case "verge", "vergecloud":
		return resolveVergeEndpoint(provider, path)
	case "arvan", "arvancloud":
		return resolveArvanEndpoint(provider, path)
	default:
		return resolveGenericEndpoint(provider, path)
	}
}

func resolveVergeEndpoint(provider config.ProviderConfig, path string) (string, error) {
	switch path {
	case "domain-details":
		return requireDomain(provider, "/domains/%s")
	case "ssl":
		return requireDomain(provider, "/domains/%s/ssl")
	case "dns":
		return requireDomain(provider, "/dns/%s/records")  // Works
	case "caching":
		return requireDomain(provider, "/caching/%s")      // Works
	case "firewall":
		// Firewall endpoint doesn't exist, return error
		return "", fmt.Errorf("firewall endpoint not available for provider %s", provider.ID)
	case "analytics":
		// Analytics endpoint doesn't exist, return error
		return "", fmt.Errorf("analytics endpoint not available for provider %s", provider.ID)
	case "domains":
		return "/domains", nil
	default:
		return ensureLeadingSlash(path), nil
	}
}

func resolveArvanEndpoint(provider config.ProviderConfig, path string) (string, error) {
	switch path {
	case "domain-details":
		return requireDomain(provider, "/domains/%s")
	case "ssl":
		return requireDomain(provider, "/domains/%s/ssl")
	case "dns":
		return requireDomain(provider, "/domains/%s/dns-records")
	case "caching":
		return requireDomain(provider, "/domains/%s/caching")
	case "firewall":
		return requireDomain(provider, "/domains/%s/firewall/settings")
	case "analytics":
		return requireDomain(provider, "/domains/%s/reports/traffics")
	case "domains":
		return "/domains", nil
	default:
		return ensureLeadingSlash(path), nil
	}
}

func resolveGenericEndpoint(provider config.ProviderConfig, path string) (string, error) {
	switch path {
	case "domain-details":
		return requireDomain(provider, "/domains/%s")
	case "ssl":
		return requireDomain(provider, "/domains/%s/ssl")
	case "dns":
		return requireDomain(provider, "/domains/%s/dns-records")
	case "caching":
		return requireDomain(provider, "/domains/%s/caching")
	case "firewall":
		return requireDomain(provider, "/domains/%s/firewall/settings")
	case "analytics":
		return requireDomain(provider, "/domains/%s/reports/traffics")
	case "domains":
		return "/domains", nil
	default:
		return ensureLeadingSlash(path), nil
	}
}

func requireDomain(provider config.ProviderConfig, pattern string) (string, error) {
	if provider.Domain == "" {
		return "", errors.New("provider domain not configured")
	}
	return fmt.Sprintf(pattern, provider.Domain), nil
}

func ensureLeadingSlash(path string) string {
	if strings.HasPrefix(path, "/") {
		return path
	}
	return "/" + path
}
