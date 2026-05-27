/**
 * k6 load test — submission pipeline
 * Target: 100 RPS, 500 concurrent users, p99 < 2s (excl. code runtime)
 *
 * Run: k6 run --vus 500 --rps 100 --duration 60s infra/loadtest/submit.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const submissionLatency = new Trend("submission_latency");

export const options = {
  stages: [
    { duration: "30s", target: 100 },   // ramp up
    { duration: "60s", target: 500 },   // sustained load
    { duration: "15s", target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(99)<2000"],  // p99 < 2s
    errors: ["rate<0.01"],              // < 1% error rate
    submission_latency: ["p(99)<2000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export function setup() {
  // Authenticate and return token for use in VUs
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: "loadtest@codecrafter.dev", password: "LoadTest123!" }),
    { headers: { "Content-Type": "application/json" } }
  );
  return { token: res.json("accessToken") };
}

export default function (data) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${data.token}`,
  };

  const payload = JSON.stringify({
    problemId: 1,
    language: "python",
    sourceCode: `
def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
`,
  });

  const start = Date.now();
  const res = http.post(`${BASE_URL}/api/v1/submissions`, payload, { headers });
  submissionLatency.add(Date.now() - start);

  const ok = check(res, {
    "submission accepted (202)": (r) => r.status === 202,
    "has submissionId": (r) => r.json("submissionId") !== undefined,
  });

  errorRate.add(!ok);
  sleep(1);
}
