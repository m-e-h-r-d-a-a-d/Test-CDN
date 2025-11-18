package tests

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/mehrdad/project/training/cloud/Test-CDN/backend/internal/config"
	"github.com/mehrdad/project/training/cloud/Test-CDN/backend/internal/providers"
)

func TestRunnerRunSuccess(t *testing.T) {
	origin := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "/security/") {
			w.WriteHeader(http.StatusForbidden)
			return
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}))
	defer origin.Close()

	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"success":true}`))
	}))
	defer api.Close()

	cfg := config.Config{
		Providers: map[string]config.ProviderConfig{
			"verge": {
				ID:        "verge",
				OriginURL: origin.URL,
				APIBase:   api.URL,
				Domain:    "example.com",
				Headers:   map[string]string{},
			},
		},
	}

	runner := NewRunner(cfg, providers.NewRegistry(cfg))
	resp, err := runner.Run(context.Background(), RunRequest{Rounds: 1})
	if err != nil {
		t.Fatalf("runner returned error: %v", err)
	}

	expected := len(FrontendEndpoints())*len(cfg.ProviderIDs()) + len(APIEndpoints())
	if len(resp.Results) != expected {
		t.Fatalf("expected %d results, got %d", expected, len(resp.Results))
	}

	foundSecurity := false
	foundAPI := false
	for _, result := range resp.Results {
		if result.BlockedBySecurity {
			foundSecurity = true
		}
		if result.IsAPITest {
			foundAPI = true
			if len(result.APIResults) != len(cfg.ProviderIDs()) {
				t.Fatalf("expected api results for each provider, got %d", len(result.APIResults))
			}
		}
	}

	if !foundSecurity {
		t.Fatal("expected at least one security-blocked request")
	}
	if !foundAPI {
		t.Fatal("expected aggregated API result")
	}
}

func TestRunnerProgressEvents(t *testing.T) {
	origin := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer origin.Close()

	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"success":true}`))
	}))
	defer api.Close()

	cfg := config.Config{
		Providers: map[string]config.ProviderConfig{
			"verge": {
				ID:        "verge",
				OriginURL: origin.URL,
				APIBase:   api.URL,
				Domain:    "example.com",
			},
		},
	}

	runner := NewRunner(cfg, providers.NewRegistry(cfg))
	var progress []ProgressEvent
	resp, err := runner.RunWithProgress(context.Background(), RunRequest{Rounds: 1}, func(ev ProgressEvent) {
		progress = append(progress, ev)
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	expected := len(FrontendEndpoints())*len(cfg.ProviderIDs()) + len(APIEndpoints())
	if len(progress) != expected {
		t.Fatalf("expected %d progress events, got %d", expected, len(progress))
	}

	last := progress[len(progress)-1]
	if last.Completed != expected || last.Total != expected {
		t.Fatalf("expected last progress to equal total (%d), got %+v", expected, last)
	}

	if len(resp.Results) != expected {
		t.Fatalf("expected resp results to match total, got %d", len(resp.Results))
	}
}
