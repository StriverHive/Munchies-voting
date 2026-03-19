/**
 * k6 load / soak script (API smoke + light load).
 *
 * Install k6: https://k6.io/docs/get-started/installation/
 *
 * Run against a running API (set VOTE_APP_BASE_URL):
 *   k6 run tests/performance/k6/api-smoke.js
 *
 * Example:
 *   set VOTE_APP_BASE_URL=http://localhost:5000 && k6 run tests/performance/k6/api-smoke.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.VOTE_APP_BASE_URL || "http://localhost:5000";

export const options = {
  vus: 3,
  duration: "20s",
  thresholds: {
    http_req_failed: ["rate<0.5"],
    http_req_duration: ["p(95)<2000"],
  },
};

export default function () {
  const res = http.get(`${BASE}/api/locations`);
  check(res, {
    "locations unauth returns 401": (r) => r.status === 401,
  });
  sleep(0.3);
}
