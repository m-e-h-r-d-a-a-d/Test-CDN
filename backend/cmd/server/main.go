package main

import (
	"log"
	"net/http"
	"os"

	"github.com/mehrdad/project/training/cloud/Test-CDN/backend/internal/config"
	"github.com/mehrdad/project/training/cloud/Test-CDN/backend/internal/providers"
	"github.com/mehrdad/project/training/cloud/Test-CDN/backend/internal/server"
)

func main() {
	cfg := config.Load()
	registry := providers.NewRegistry(cfg)
	s := server.New(cfg, registry)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("cdn-test backend listening on :%s", port)
	if err := http.ListenAndServe(":"+port, s.Handler()); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}

