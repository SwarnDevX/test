/**
 * k6 browse load test — read-only paths (no auth required)
 * Simulates users browsing the problem list, problem details, and public profiles.
 *
 * Run: k6 run --vus 200 --duration 60s infra/loadtest/browse.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");
const BASE_URL  = __ENV.BASE_URL || "http://localhost:8080";

export const options = {
  stages: [
    { duration: "20s", target: 50  },
    { duration: "60s", target: 200 },
    { duration: "10s", target: 0   },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    errors:            ["rate<0.005"],
  },
};

const PROBLEM_SLUGS = ["two-sum", "add-two-numbers", "longest-substring-without-repeating-characters"];

export default function () {
  // 1. Problem list
  let r = http.get(`${BASE_URL}/api/v1/problems?page=0&size=20`);
  errorRate.add(!check(r, { "problems list 200": res => res.status === 200 }));

  // 2. Random problem detail
  const slug = PROBLEM_SLUGS[Math.floor(Math.random() * PROBLEM_SLUGS.length)];
  r = http.get(`${BASE_URL}/api/v1/problems/${slug}`);
  errorRate.add(!check(r, { "problem detail 200": res => res.status === 200 }));

  // 3. Contests list
  r = http.get(`${BASE_URL}/api/v1/contests?page=0&size=10`);
  errorRate.add(!check(r, { "contests 200": res => res.status === 200 }));

  // 4. Study plans
  r = http.get(`${BASE_URL}/api/v1/study-plans`);
  errorRate.add(!check(r, { "study plans 200": res => res.status === 200 }));

  sleep(1);
}
