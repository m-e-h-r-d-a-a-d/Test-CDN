package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/mehrdad/project/training/cloud/Test-CDN/backend/internal/providers"
	"github.com/mehrdad/project/training/cloud/Test-CDN/backend/internal/tests"
)

type apiResponse struct {
	Provider string      `json:"provider"`
	Endpoint string      `json:"endpoint"`
	Domain   string      `json:"domain,omitempty"`
	Status   int         `json:"status"`
	Success  bool        `json:"success"`
	Data     interface{} `json:"data"`
	Error    string      `json:"error,omitempty"`
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}

func (s *Server) handleAPITest(w http.ResponseWriter, r *http.Request) {
	providerID := s.normalizeProviderID(r.URL.Query().Get("provider"))

	resource := strings.TrimPrefix(r.URL.Path, "/api-test")
	if resource == "" || resource == "/" {
		writeJSON(w, http.StatusBadRequest, apiResponse{
			Provider: providerID,
			Success:  false,
			Error:    "missing resource",
		})
		return
	}

	body, status, err := s.registry.Call(providerID, resource)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{
			Provider: providerID,
			Endpoint: resource,
			Status:   status,
			Success:  false,
			Error:    err.Error(),
		})
		return
	}

	var data interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		data = string(body)
	}

	writeJSON(w, http.StatusOK, apiResponse{
		Provider: providerID,
		Endpoint: resource,
		Status:   status,
		Success:  status >= 200 && status < 300,
		Data:     data,
	})
}

type purgeRequest struct {
	Provider string `json:"provider"`
	Type     string `json:"type"`
	URL      string `json:"url"`
}

func (s *Server) handlePurge(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req purgeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON body"})
		return
	}

	provider := strings.ToLower(strings.TrimSpace(firstNonEmpty(req.Provider, req.Type)))
	if provider == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "provider required"})
		return
	}
	if req.URL == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "url required"})
		return
	}

	result, err := providers.ExecutePurge(provider, req.URL)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"ok":    false,
			"error": err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"ok":       true,
		"provider": provider,
		"result":   result,
	})
}

func (s *Server) handleRunTests(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req tests.RunRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON body"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	res, err := s.runner.Run(ctx, req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, res)
}

func (s *Server) handleRunTestsStream(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming not supported", http.StatusInternalServerError)
		return
	}

	req := tests.RunRequest{
		Rounds:       parseIntQuery(r, "rounds", 1),
		DelaySeconds: parseIntQuery(r, "delay", 0),
		Providers:    parseProvidersQuery(r.URL.Query().Get("providers")),
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	setSSEHeaders(w)

	sendEvent := func(event string, payload interface{}) error {
		data, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		if _, err := fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event, data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}

	res, err := s.runner.RunWithProgress(ctx, req, func(pe tests.ProgressEvent) {
		if err := sendEvent("progress", pe); err != nil {
			log.Printf("sse progress send error: %v", err)
			cancel()
		}
	})
	if err != nil {
		_ = sendEvent("error", map[string]string{"error": err.Error()})
		return
	}

	_ = sendEvent("complete", res)
}

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

func (s *Server) normalizeProviderID(value string) string {
	key := strings.ToLower(strings.TrimSpace(value))
	if key == "" {
		return s.cfg.DefaultProviderID()
	}

	aliases := map[string]string{
		"vergecloud": "verge",
		"arvancloud": "arvan",
	}
	if alias, ok := aliases[key]; ok {
		key = alias
	}

	if _, ok := s.cfg.ProviderByID(key); ok {
		return key
	}
	return s.cfg.DefaultProviderID()
}

func parseProvidersQuery(value string) []string {
	if value == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}

func parseIntQuery(r *http.Request, key string, fallback int) int {
	val := strings.TrimSpace(r.URL.Query().Get(key))
	if val == "" {
		return fallback
	}
	if out, err := strconv.Atoi(val); err == nil {
		return out
	}
	return fallback
}

func setSSEHeaders(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
