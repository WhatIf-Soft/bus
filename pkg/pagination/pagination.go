package pagination

import (
	"net/http"
	"strconv"
)

const (
	defaultPage    = 1
	defaultPerPage = 20
	maxPerPage     = 100
)

// Params holds parsed pagination parameters.
type Params struct {
	Page    int
	PerPage int
}

// FromRequest parses page and per_page query parameters from the request.
// Defaults to page 1 and 20 items per page. Max per_page is 100.
func FromRequest(r *http.Request) Params {
	page := parseIntDefault(r.URL.Query().Get("page"), defaultPage)
	perPage := parseIntDefault(r.URL.Query().Get("per_page"), defaultPerPage)

	if page < 1 {
		page = defaultPage
	}
	if perPage < 1 {
		perPage = defaultPerPage
	}
	if perPage > maxPerPage {
		perPage = maxPerPage
	}

	return Params{
		Page:    page,
		PerPage: perPage,
	}
}

// Offset returns the SQL OFFSET value for the current page.
func (p Params) Offset() int {
	return (p.Page - 1) * p.PerPage
}

// Limit returns the SQL LIMIT value.
func (p Params) Limit() int {
	return p.PerPage
}

func parseIntDefault(s string, defaultVal int) int {
	if s == "" {
		return defaultVal
	}
	v, err := strconv.Atoi(s)
	if err != nil {
		return defaultVal
	}
	return v
}
