package tests

type Endpoint struct {
	ID       string
	Name     string
	Path     string
	Category string
}

var frontendEndpoints = []Endpoint{
	{ID: "root", Name: "Root Page", Path: "/", Category: "performance"},
	{ID: "large", Name: "Large File", Path: "/large-probe.txt", Category: "performance"},
	{ID: "small", Name: "Small File", Path: "/probe.txt", Category: "performance"},
	{ID: "cache-time", Name: "Cache Headers", Path: "/api/time", Category: "caching"},
	{ID: "cache-bypass", Name: "Cache Bypass", Path: "/cache/bypass/nocache", Category: "caching"},
	{ID: "sql", Name: "Security - SQL", Path: "/security/sql/union", Category: "security"},
	{ID: "xss", Name: "Security - XSS", Path: "/security/xss/script", Category: "security"},
	{ID: "redirect", Name: "Redirect 301", Path: "/redirect/301", Category: "features"},
}

var apiEndpoints = []Endpoint{
	{ID: "api-domains", Name: "API: List Domains", Path: "/api-test/domains", Category: "api"},
	{ID: "api-domain-details", Name: "API: Domain Details", Path: "/api-test/domain-details", Category: "api"},
	{ID: "api-ssl", Name: "API: SSL Settings", Path: "/api-test/ssl", Category: "api"},
	{ID: "api-dns", Name: "API: DNS Records", Path: "/api-test/dns", Category: "api"},
	{ID: "api-caching", Name: "API: Cache Settings", Path: "/api-test/caching", Category: "api"},
	{ID: "api-firewall", Name: "API: Firewall Rules", Path: "/api-test/firewall", Category: "api"},
	{ID: "api-analytics", Name: "API: Traffic Reports", Path: "/api-test/analytics", Category: "api"},
}

func AllEndpoints() []Endpoint {
	return append(append([]Endpoint{}, frontendEndpoints...), apiEndpoints...)
}

func IsAPICategory(category string) bool {
	return category == "api"
}

func FrontendEndpoints() []Endpoint {
	return append([]Endpoint{}, frontendEndpoints...)
}

func APIEndpoints() []Endpoint {
	return append([]Endpoint{}, apiEndpoints...)
}
