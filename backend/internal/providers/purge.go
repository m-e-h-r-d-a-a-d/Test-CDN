package providers

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type purgeResult struct {
	Status int         `json:"status"`
	Data   interface{} `json:"data"`
}

func ExecutePurge(provider, targetURL string) (interface{}, error) {
	switch provider {
	case "cloudflare":
		return purgeCloudflare(targetURL)
	case "arvan", "arvancloud":
		return purgeArvan(targetURL)
	case "verge", "vergecloud":
		return purgeVerge(targetURL)
	default:
		return nil, fmt.Errorf("unknown provider: %s", provider)
	}
}

func purgeCloudflare(target string) (interface{}, error) {
	zone := os.Getenv("CF_ZONE_ID")
	token := os.Getenv("CF_API_TOKEN")
	if zone == "" || token == "" {
		return nil, errors.New("cloudflare token/zone missing on server")
	}
	endpoint := fmt.Sprintf("https://api.cloudflare.com/client/v4/zones/%s/purge_cache", zone)
	headers := map[string]string{
		"Authorization": "Bearer " + token,
		"Content-Type":  "application/json",
	}
	body := map[string]interface{}{"files": []string{target}}
	return performJSONRequest(endpoint, headers, body)
}

func purgeArvan(target string) (interface{}, error) {
	base := strings.TrimRight(envOr("ARVAN_API_BASE", "https://napi.arvancloud.ir/cdn/4.0"), "/")
	domain := os.Getenv("ARVAN_DOMAIN")
	token := os.Getenv("ARVAN_TOKEN")
	if base == "" || domain == "" || token == "" {
		return nil, errors.New("arvancloud token/domain missing on server")
	}
	endpoint := fmt.Sprintf("%s/domains/%s/caching/purge", base, domain)
	headers := map[string]string{
		"Authorization": "apikey " + token,
		"Content-Type":  "application/json",
	}
	body := map[string]interface{}{
		"purge":      "individual",
		"purge_urls": []string{target},
	}
	return performJSONRequest(endpoint, headers, body)
}

func purgeVerge(target string) (interface{}, error) {
	base := strings.TrimRight(envOr("VERGE_API_BASE", "https://api.vergecloud.com/v1"), "/")
	domain := os.Getenv("VERGE_DOMAIN")
	token := os.Getenv("VERGE_TOKEN")
	if base == "" || domain == "" || token == "" {
		return nil, errors.New("vergecloud token/domain missing on server")
	}
	endpoint := base + "/purge"
	headers := map[string]string{
		"X-API-Key":    token,
		"Content-Type": "application/json",
	}
	body := map[string]interface{}{
		"domain": domain,
		"files":  []string{target},
	}
	return performJSONRequest(endpoint, headers, body)
}

func performJSONRequest(url string, headers map[string]string, payload interface{}) (interface{}, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var parsed interface{}
	if err := json.Unmarshal(body, &parsed); err != nil {
		parsed = string(body)
	}

	return purgeResult{Status: resp.StatusCode, Data: parsed}, nil
}

func envOr(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

