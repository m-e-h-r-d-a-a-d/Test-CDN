package providers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/mehrdad/project/training/cloud/Test-CDN/backend/internal/config"
)

func TestRegistryCallDomainEndpoints(t *testing.T) {
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/domains/example.com" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer api.Close()

	cfg := config.Config{
		Providers: map[string]config.ProviderConfig{
			"verge": {
				ID:      "verge",
				APIBase: api.URL,
				Domain:  "example.com",
				Headers: map[string]string{"X-Test": "1"},
			},
		},
	}

	reg := NewRegistry(cfg)
	body, status, err := reg.Call("verge", "/domain-details")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if status != http.StatusOK {
		t.Fatalf("expected status 200, got %d", status)
	}
	if string(body) != `{"ok":true}` {
		t.Fatalf("unexpected body: %s", string(body))
	}
}

func TestResolveEndpointRequiresDomain(t *testing.T) {
	_, err := resolveEndpoint(config.ProviderConfig{Domain: ""}, "/domain-details")
	if err == nil {
		t.Fatal("expected error when domain missing")
	}
}
