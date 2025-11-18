package server

import (
	"net/http"

	"github.com/mehrdad/project/training/cloud/Test-CDN/backend/internal/config"
	"github.com/mehrdad/project/training/cloud/Test-CDN/backend/internal/providers"
	"github.com/mehrdad/project/training/cloud/Test-CDN/backend/internal/tests"
)

type Server struct {
	cfg      config.Config
	registry *providers.Registry
	runner   *tests.Runner
}

func New(cfg config.Config, registry *providers.Registry) *Server {
	return &Server{
		cfg:      cfg,
		registry: registry,
		runner:   tests.NewRunner(cfg, registry),
	}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/api-test/", s.handleAPITest)
	mux.HandleFunc("/api-test", s.handleAPITest)
	mux.HandleFunc("/purge", s.handlePurge)
	mux.HandleFunc("/tests/run", s.handleRunTests)
	mux.HandleFunc("/tests/run/stream", s.handleRunTestsStream)
	return withCORS(loggingMiddleware(mux))
}
