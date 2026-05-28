import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { DailyChallengeBanner } from "@/components/challenge/DailyChallengeBanner";
import {
  Code2,
  Zap,
  Trophy,
  BookOpen,
  TrendingUp,
  Users,
  ArrowRight,
  Terminal,
  Shield,
  GitBranch,
  BarChart3,
  Clock,
} from "lucide-react";

const features = [
  {
    icon: Code2,
    title: "1,500+ Problems",
    description:
      "Curated problems from Easy to Hard, tagged by company, topic, and difficulty. Filter by your target company.",
  },
  {
    icon: Terminal,
    title: "Secure Sandbox",
    description:
      "Code runs in isolated Docker containers with seccomp profiles, cgroup limits, and zero network access.",
  },
  {
    icon: Trophy,
    title: "Weekly Contests",
    description:
      "Rated competitive contests with real-time leaderboards and Elo-based rating changes.",
  },
  {
    icon: BookOpen,
    title: "Study Plans",
    description:
      "Structured learning paths: Blind 75, Top Interview 150, Sliding Window, DP Patterns, and more.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description:
      "GitHub-style activity heatmap, streak tracking, solved-by-difficulty stats, and performance charts.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Editorial write-ups, community solutions, threaded discussions, and per-problem forums.",
  },
  {
    icon: Shield,
    title: "7 Languages",
    description:
      "Java, Python 3, C++, JavaScript, Go, C, and Rust — all with language-specific driver harnesses.",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description:
      "Language breakdown, time-on-problem, submission history, and global ranking.",
  },
  {
    icon: Clock,
    title: "Daily Challenge",
    description:
      "One problem each day with bonus points. Miss a day, reset your streak. Stay consistent.",
  },
];

const steps = [
  {
    step: "01",
    title: "Pick a problem",
    description:
      "Filter by difficulty, topic tag, or company. Use a curated study plan for structured progression.",
  },
  {
    step: "02",
    title: "Write your solution",
    description:
      "Monaco editor with syntax highlighting, vim/emacs keybindings, custom test inputs, and a built-in timer.",
  },
  {
    step: "03",
    title: "Get instant feedback",
    description:
      "Submissions run in isolated containers. Verdict streams back over WebSocket: QUEUED → RUNNING → AC/WA.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-emerald-500" />
            <span className="font-bold tracking-tight">CodeCrafter</span>
          </div>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link
              href="/problems"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Problems
            </Link>
            <Link
              href="/contests"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Contests
            </Link>
            <Link
              href="/discuss"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Discuss
            </Link>
            <Link
              href="/study-plans"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Study Plans
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-500"
              asChild
            >
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-24 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
          <Zap className="h-3.5 w-3.5" />
          <span>Open beta — free for everyone</span>
        </div>

        <h1 className="mb-6 bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-7xl">
          Master coding
          <br />
          interviews.
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
          A production-grade platform for competitive programming and interview
          prep. Write, run, and submit code in a secure sandboxed environment.
          Track everything.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row mb-12">
          <Button
            size="lg"
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
            asChild
          >
            <Link href="/signup">
              Start solving free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/problems">Browse problems</Link>
          </Button>
        </div>

        {/* Daily challenge — silently omitted if none scheduled */}
        <div className="mx-auto max-w-xl">
          <DailyChallengeBanner />
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────── */}
      <div className="border-y border-border/40 bg-muted/20">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-10 text-center md:grid-cols-4">
          {[
            { label: "Problems", value: "1,500+" },
            { label: "Active Users", value: "10,000+" },
            { label: "Daily Submissions", value: "50,000+" },
            { label: "Languages", value: "7" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features grid ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to level up
          </h2>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Built for serious engineers who want more than a problem list.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border/60 bg-card p-6 transition-all duration-200 hover:border-emerald-500/40 hover:bg-muted/40"
            >
              <feature.icon className="mb-4 h-7 w-7 text-emerald-500" />
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="border-t border-border/40 bg-muted/10">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              From problem to verdict in seconds
            </h2>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="flex flex-col">
                <span className="mb-4 font-mono text-5xl font-bold text-emerald-500/20">
                  {s.step}
                </span>
                <h3 className="mb-3 text-xl font-semibold">{s.title}</h3>
                <p className="leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Code preview strip ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-500/70" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <div className="h-3 w-3 rounded-full bg-green-500/70" />
            <span className="ml-2 text-xs text-muted-foreground">solution.py</span>
            <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
              Accepted ✓
            </span>
          </div>
          <pre className="overflow-x-auto p-6 text-sm leading-relaxed">
            <code className="text-foreground/90">
{`def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Runtime: 52 ms  ·  Memory: 17.3 MB
# Beats 94.2% of Python3 submissions`}
            </code>
          </pre>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="border-t border-border/40 bg-muted/10">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Ready to start?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-lg text-muted-foreground">
            Join thousands of engineers sharpening their skills every day.
            Free forever for core features.
          </p>
          <Button
            size="lg"
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
            asChild
          >
            <Link href="/signup">
              Create free account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 bg-muted/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold">CodeCrafter</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CodeCrafter. Built for engineers, by engineers.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link
              href="https://github.com/SwarnDevX/codecrafter"
              className="hover:text-foreground"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
