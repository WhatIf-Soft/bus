// k6 load test for search-service.
// Targets the SLA from CLAUDE.md §1: search P95 < 800 ms.
//
// Run:
//   k6 run deploy/k6/search.js
// Override target:
//   k6 run -e BASE_URL=http://localhost:4002 deploy/k6/search.js

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4002';

const ROUTES = [
  ['Abidjan', 'Yamoussoukro'],
  ['Abidjan', 'Bouake'],
  ['Abidjan', 'Accra'],
  ['Accra', 'Lome'],
  ['Lome', 'Cotonou'],
  ['Abidjan', 'Ouagadougou'],
  ['Ouagadougou', 'Bamako'],
];

function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '15s',
      gracefulStop: '5s',
      tags: { phase: 'smoke' },
    },
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 20 },
        { duration: '40s', target: 50 },
        { duration: '20s', target: 0 },
      ],
      startTime: '20s',
      tags: { phase: 'ramp' },
    },
  },
  thresholds: {
    // CLAUDE.md §1 — search P95 must stay under 800 ms.
    'http_req_duration{name:trips}': ['p(95)<800'],
    'http_req_duration{name:autocomplete}': ['p(95)<200'],
    'checks': ['rate>0.99'],
  },
};

export default function () {
  const [origin, destination] = ROUTES[Math.floor(Math.random() * ROUTES.length)];

  const tripsURL = `${BASE_URL}/api/v1/search/trips` +
    `?origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}` +
    `&date=${todayIso()}` +
    '&passengers=1';

  const tripsRes = http.get(tripsURL, { tags: { name: 'trips' } });
  check(tripsRes, {
    'trips 200': (r) => r.status === 200,
    'trips returns success envelope': (r) => {
      try { return JSON.parse(r.body).success === true; } catch { return false; }
    },
  });

  const acRes = http.get(
    `${BASE_URL}/api/v1/search/autocomplete?q=${encodeURIComponent(origin.slice(0, 3))}`,
    { tags: { name: 'autocomplete' } },
  );
  check(acRes, {
    'autocomplete 200': (r) => r.status === 200,
  });

  sleep(0.5);
}
