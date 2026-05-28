/**
 * k6 combined scenario test — mixed realistic traffic
 *
 * Scenarios running in parallel:
 *   browse    — anonymous users reading problems/contests (300 VUs)
 *   submit    — authenticated users submitting code (100 VUs, rate-limited to 5/min per user)
 *   api_reads — authenticated profile/stats reads (100 VUs)
 *
 * Target: sustain 100 submission RPS with p99 < 2s for the submit accept response.
 *
 * Run: k6 run --env BASE_URL=http://localhost:8080 infra/loadtest/scenarios.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

const submitErrors  = new Rate("submit_errors");
const browseErrors  = new Rate("browse_errors");
const submitLatency = new Trend("submit_latency_ms");
const totalSubmits  = new Counter("total_submits");

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export const options = {
  scenarios: {
    browse: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 100 },
        { duration: "90s", target: 300 },
        { duration: "15s", target: 0   },
      ],
      exec: "browseScenario",
    },
    submit: {
      executor: "constant-arrival-rate",
      rate: 100,            // 100 iterations/second
      timeUnit: "1s",
      duration: "2m",
      preAllocatedVUs: 100,
      maxVUs: 500,
      startTime: "30s",     // start after browse warms up
      exec: "submitScenario",
    },
    api_reads: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50  },
        { duration: "90s", target: 100 },
        { duration: "15s", target: 0   },
      ],
      startTime: "30s",
      exec: "apiReadScenario",
    },
  },
  thresholds: {
    "http_req_duration{scenario:browse}":    ["p(95)<400",  "p(99)<800"  ],
    "http_req_duration{scenario:submit}":    ["p(95)<1500", "p(99)<2000" ],
    "http_req_duration{scenario:api_reads}": ["p(95)<300",  "p(99)<600"  ],
    submit_errors: ["rate<0.01"],
    browse_errors: ["rate<0.005"],
  },
};

// ── Shared setup ──────────────────────────────────────────────────────────────

export function setup() {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: "loadtest@codecrafter.dev", password: "LoadTest123!" }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(res, { "login 200": r => r.status === 200 });
  return { token: res.json("accessToken") };
}

// ── Browse scenario (anonymous) ───────────────────────────────────────────────

const SLUGS = ["two-sum", "add-two-numbers", "longest-substring-without-repeating-characters",
               "median-of-two-sorted-arrays", "longest-palindromic-substring"];

export function browseScenario() {
  const slug = SLUGS[Math.floor(Math.random() * SLUGS.length)];

  let r = http.get(`${BASE_URL}/api/v1/problems?page=0&size=20`);
  browseErrors.add(!check(r, { "list 200": res => res.status === 200 }));

  r = http.get(`${BASE_URL}/api/v1/problems/${slug}`);
  browseErrors.add(!check(r, { "detail 200": res => res.status === 200 }));

  sleep(Math.random() * 2 + 0.5);
}

// ── Submit scenario (authenticated) ──────────────────────────────────────────

const SOLUTIONS = [
  { language: "python", code: "def twoSum(nums, target):\n    s={}\n    for i,n in enumerate(nums):\n        if target-n in s: return [s[target-n],i]\n        s[n]=i" },
  { language: "java",   code: "class Solution{public int[] twoSum(int[] n,int t){Map<Integer,Integer> m=new HashMap<>();for(int i=0;i<n.length;i++){int c=t-n[i];if(m.containsKey(c))return new int[]{m.get(c),i};m.put(n[i],i);}return new int[]{};}" },
  { language: "javascript", code: "var twoSum=(nums,target)=>{const m={};for(let i=0;i<nums.length;i++){const c=target-nums[i];if(m[c]!==undefined)return[m[c],i];m[nums[i]]=i;}}" },
];

export function submitScenario(data) {
  const sol = SOLUTIONS[Math.floor(Math.random() * SOLUTIONS.length)];
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${data.token}`,
  };

  const start = Date.now();
  const r = http.post(
    `${BASE_URL}/api/v1/problems/two-sum/submit`,
    JSON.stringify({ language: sol.language, sourceCode: sol.code }),
    { headers }
  );
  submitLatency.add(Date.now() - start);
  totalSubmits.add(1);

  const ok = check(r, {
    "submit accepted (202)": res => res.status === 202,
    "has id":                res => res.json("id") !== undefined,
  });
  submitErrors.add(!ok);
}

// ── API read scenario (authenticated) ─────────────────────────────────────────

export function apiReadScenario(data) {
  const headers = { Authorization: `Bearer ${data.token}` };

  let r = http.get(`${BASE_URL}/api/v1/users/me`, { headers });
  check(r, { "me 200": res => res.status === 200 });

  r = http.get(`${BASE_URL}/api/v1/submissions?page=0&size=10`, { headers });
  check(r, { "submissions 200": res => res.status === 200 });

  r = http.get(`${BASE_URL}/api/v1/daily-challenge`);
  check(r, { "daily challenge 200/404": res => res.status === 200 || res.status === 404 });

  sleep(Math.random() * 1.5 + 0.5);
}
