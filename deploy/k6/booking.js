// k6 concurrent booking stress test.
// Validates the Redlock guarantee: 100 VUs race for the same seat —
// exactly one must get a 201, all others get 409.
//
// Prerequisite: all services running + auth token in env:
//   export K6_AUTH_TOKEN=$(curl -s -X POST http://localhost:4001/api/v1/users/login \
//     -H "Content-Type: application/json" \
//     -d '{"email":"booker@example.com","password":"Password123!"}' | jq -r .data.access_token)
//   export K6_TRIP_ID=<pick a trip from search-service>
//
// Run:
//   k6 run deploy/k6/booking.js

import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const BOOKING_URL = __ENV.BOOKING_URL || 'http://localhost:4003';
const TOKEN = __ENV.K6_AUTH_TOKEN || '';
const TRIP_ID = __ENV.K6_TRIP_ID || '';

const successes = new Counter('booking_successes');
const conflicts = new Counter('booking_conflicts');

export const options = {
  scenarios: {
    race: {
      executor: 'shared-iterations',
      vus: 100,
      iterations: 100,
      maxDuration: '30s',
    },
  },
  thresholds: {
    // Exactly one 201 expected. We measure via custom counters.
    'booking_successes': ['count==1'],
    'checks': ['rate>0.95'],
  },
};

export default function () {
  const idempotencyKey = `k6-${__VU}-${Date.now()}`;
  const body = JSON.stringify({
    trip_id: TRIP_ID,
    seats: [
      {
        seat_number: '1A',
        first_name: 'K6',
        last_name: `VU-${__VU}`,
        category: 'adult',
      },
    ],
  });

  const res = http.post(`${BOOKING_URL}/api/v1/bookings/`, body, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      'Idempotency-Key': idempotencyKey,
    },
  });

  const is201 = res.status === 201;
  const is409 = res.status === 409;

  check(res, {
    'response is 201 or 409': () => is201 || is409,
  });

  if (is201) {
    successes.add(1);
  }
  if (is409) {
    conflicts.add(1);
  }
}
