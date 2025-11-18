package tests

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/mehrdad/project/training/cloud/Test-CDN/backend/internal/config"
	"github.com/mehrdad/project/training/cloud/Test-CDN/backend/internal/providers"
)

type Runner struct {
	cfg      config.Config
	registry *providers.Registry
	client   *http.Client
}

func NewRunner(cfg config.Config, registry *providers.Registry) *Runner {
	return &Runner{
		cfg:      cfg,
		registry: registry,
		client:   &http.Client{Timeout: 30 * time.Second},
	}
}

type RunRequest struct {
	Rounds       int      `json:"rounds"`
	DelaySeconds int      `json:"delay"`
	Providers    []string `json:"providers"`
}

type RunResponse struct {
	Results []Result `json:"results"`
}

type Result struct {
	EndpointID        string            `json:"endpointId"`
	EndpointName      string            `json:"endpointName"`
	ProviderID        string            `json:"providerId"`
	URL               string            `json:"url,omitempty"`
	Status            interface{}       `json:"status"`
	StatusText        string            `json:"statusText,omitempty"`
	Duration          int64             `json:"duration"`
	Success           bool              `json:"success"`
	BlockedBySecurity bool              `json:"blockedBySecurity,omitempty"`
	Headers           map[string]string `json:"headers,omitempty"`
	Error             string            `json:"error,omitempty"`
	IsAPITest         bool              `json:"isApiTest,omitempty"`
	APIResults        []APIResult       `json:"apiResults,omitempty"`
}

type APIResult struct {
	ProviderID string      `json:"providerId"`
	Success    bool        `json:"success"`
	Status     int         `json:"status"`
	Error      string      `json:"error,omitempty"`
	Data       interface{} `json:"data,omitempty"`
}

type ProgressEvent struct {
	Completed int     `json:"completed"`
	Total     int     `json:"total"`
	Result    *Result `json:"result,omitempty"`
}

func (r *Runner) Run(ctx context.Context, req RunRequest) (RunResponse, error) {
	return r.run(ctx, req, nil)
}

func (r *Runner) RunWithProgress(ctx context.Context, req RunRequest, handler func(ProgressEvent)) (RunResponse, error) {
	return r.run(ctx, req, handler)
}

func (r *Runner) run(ctx context.Context, req RunRequest, handler func(ProgressEvent)) (RunResponse, error) {
	if req.Rounds <= 0 {
		req.Rounds = 1
	}
	if req.DelaySeconds < 0 {
		req.DelaySeconds = 0
	}

	providerIDs := r.resolveProviders(req.Providers)
	if len(providerIDs) == 0 {
		return RunResponse{}, errors.New("no providers configured")
	}

	frontendEndpoints := FrontendEndpoints()
	apiEndpoints := APIEndpoints()
	delay := time.Duration(req.DelaySeconds) * time.Second
	totalPerRound := len(frontendEndpoints)*len(providerIDs) + len(apiEndpoints)
	totalTests := totalPerRound * req.Rounds
	results := make([]Result, 0, totalTests)
	completed := 0

	emitProgress := func(res Result) {
		completed++
		if handler != nil {
			copied := res
			handler(ProgressEvent{
				Completed: completed,
				Total:     totalTests,
				Result:    &copied,
			})
		}
	}

	for round := 0; round < req.Rounds; round++ {
		for _, endpoint := range frontendEndpoints {
			select {
			case <-ctx.Done():
				return RunResponse{}, ctx.Err()
			default:
			}

			for _, providerID := range providerIDs {
				result := r.runHTTPTest(ctx, endpoint, providerID)
				results = append(results, result)
				emitProgress(result)
			}
		}

		for _, endpoint := range apiEndpoints {
			select {
			case <-ctx.Done():
				return RunResponse{}, ctx.Err()
			default:
			}

			result := r.runAPITest(ctx, endpoint, providerIDs)
			results = append(results, result)
			emitProgress(result)
		}

		if round < req.Rounds-1 && delay > 0 {
			select {
			case <-ctx.Done():
				return RunResponse{}, ctx.Err()
			case <-time.After(delay):
			}
		}
	}

	return RunResponse{Results: results}, nil
}

func (r *Runner) resolveProviders(requested []string) []string {
	if len(requested) == 0 {
		return r.cfg.ProviderIDs()
	}

	resolved := make([]string, 0, len(requested))
	for _, id := range requested {
		if _, ok := r.cfg.ProviderByID(id); ok {
			resolved = append(resolved, id)
		}
	}
	if len(resolved) == 0 {
		return r.cfg.ProviderIDs()
	}
	return resolved
}

func (r *Runner) runHTTPTest(ctx context.Context, endpoint Endpoint, providerID string) Result {
	provider, ok := r.cfg.ProviderByID(providerID)
	if !ok {
		return Result{
			EndpointID:   endpoint.ID,
			EndpointName: endpoint.Name,
			ProviderID:   providerID,
			Status:       "ERROR",
			Error:        "provider not configured",
			Success:      false,
		}
	}

	if provider.OriginURL == "" {
		return Result{
			EndpointID:   endpoint.ID,
			EndpointName: endpoint.Name,
			ProviderID:   providerID,
			Status:       "ERROR",
			Error:        "provider origin URL not configured",
			Success:      false,
		}
	}

	url := provider.OriginURL + endpoint.Path
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return Result{
			EndpointID:   endpoint.ID,
			EndpointName: endpoint.Name,
			ProviderID:   providerID,
			URL:          url,
			Status:       "ERROR",
			Error:        err.Error(),
			Success:      false,
		}
	}

	start := time.Now()
	resp, err := r.client.Do(req)
	if err != nil {
		return Result{
			EndpointID:   endpoint.ID,
			EndpointName: endpoint.Name,
			ProviderID:   providerID,
			URL:          url,
			Status:       "ERROR",
			Error:        err.Error(),
			Success:      false,
		}
	}
	defer resp.Body.Close()

	headers := flattenHeaders(resp.Header)
	duration := time.Since(start).Milliseconds()
	isSecurityTest := endpoint.Category == "security" || strings.Contains(endpoint.Path, "/security/")
	blockedBySecurity := isSecurityTest && resp.StatusCode == http.StatusForbidden
	success := (resp.StatusCode >= 200 && resp.StatusCode < 300) || blockedBySecurity

	return Result{
		EndpointID:        endpoint.ID,
		EndpointName:      endpoint.Name,
		ProviderID:        providerID,
		URL:               url,
		Status:            resp.StatusCode,
		StatusText:        resp.Status,
		Duration:          duration,
		Success:           success,
		BlockedBySecurity: blockedBySecurity,
		Headers:           headers,
	}
}

func (r *Runner) runAPITest(ctx context.Context, endpoint Endpoint, providerIDs []string) Result {
	apiResults := make([]APIResult, 0, len(providerIDs))
	start := time.Now()

	for _, providerID := range providerIDs {
		body, status, err := r.registry.Call(providerID, strings.TrimPrefix(endpoint.Path, "/api-test"))
		apiResult := APIResult{
			ProviderID: providerID,
			Status:     status,
		}

		if err != nil {
			apiResult.Success = false
			apiResult.Error = err.Error()
		} else {
			apiResult.Success = status >= 200 && status < 300
			var data interface{}
			if err := json.Unmarshal(body, &data); err == nil {
				apiResult.Data = data
			} else {
				apiResult.Data = string(body)
			}
		}

		apiResults = append(apiResults, apiResult)
	}

	success := false
	for _, res := range apiResults {
		if res.Success {
			success = true
			break
		}
	}

	return Result{
		EndpointID:   endpoint.ID,
		EndpointName: endpoint.Name,
		ProviderID:   "api",
		IsAPITest:    true,
		Duration:     time.Since(start).Milliseconds(),
		Success:      success,
		APIResults:   apiResults,
	}
}

func flattenHeaders(h http.Header) map[string]string {
	out := make(map[string]string, len(h))
	for key, values := range h {
		out[key] = strings.Join(values, ", ")
	}
	return out
}
