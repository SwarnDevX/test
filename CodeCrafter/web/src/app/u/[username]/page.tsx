import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  Github, Linkedin, Twitter, MapPin, Briefcase,
  GraduationCap, Calendar, Flame, Trophy, Clock,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityHeatmap } from "@/components/stats/ActivityHeatmap";
import { SolvedDonut } from "@/components/stats/SolvedDonut";
import { TagBarChart } from "@/components/stats/TagBarChart";
import { LanguageBar } from "@/components/stats/LanguageBar";
import { BadgeGrid } from "@/components/stats/BadgeGrid";
import { RatingGraph } from "@/components/stats/RatingGraph";
import type { UserStatsDetail } from "@/types/stats";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

interface PublicProfile {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  school: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  preferredLanguages: string[];
  stats: { easySolved: number; mediumSolved: number; hardSolved: number; totalSolved: number; currentStreak: number; longestStreak: number; ranking: number; reputation: number };
  memberSince: string;
}

async function getProfile(username: string): Promise<PublicProfile | null> {
  const res = await fetch(`${BACKEND}/api/v1/u/${username}`, { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

async function getStatsDetail(username: string): Promise<UserStatsDetail | null> {
  try {
    const res = await fetch(`${BACKEND}/api/v1/u/${username}/stats`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const profile = await getProfile(params.username);
  if (!profile) return { title: "User not found — CodeCrafter" };
  return {
    title: `${profile.displayName ?? profile.username} (@${profile.username}) — CodeCrafter`,
    description: profile.bio ?? `${profile.username}'s CodeCrafter profile`,
  };
}

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
  const [profile, detail] = await Promise.all([
    getProfile(params.username),
    getStatsDetail(params.username),
  ]);
  if (!profile) notFound();

  const memberSince = new Date(profile.memberSince).toLocaleDateString("en-US", {
    year: "numeric", month: "long",
  });

  const s = detail ?? {
    easySolved: profile.stats.easySolved,
    mediumSolved: profile.stats.mediumSolved,
    hardSolved: profile.stats.hardSolved,
    totalSolved: profile.stats.totalSolved,
    currentStreak: profile.stats.currentStreak,
    longestStreak: profile.stats.longestStreak,
    ranking: profile.stats.ranking,
    heatmap: [], languageBreakdown: [], topTags: [], recentAc: [], badges: [],
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* ── Left sidebar ─────────────────────────────── */}
        <div className="md:col-span-1 space-y-5">
          {/* Avatar + name */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="h-24 w-24 rounded-full bg-zinc-800 overflow-hidden ring-2 ring-emerald-500/30">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt={profile.username} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-zinc-500">
                  {(profile.displayName ?? profile.username)[0].toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{profile.displayName ?? profile.username}</h1>
              <p className="text-zinc-400 text-sm">@{profile.username}</p>
            </div>
          </div>

          {profile.bio && <p className="text-sm text-zinc-300 leading-relaxed">{profile.bio}</p>}

          <div className="space-y-2 text-sm text-zinc-400">
            {profile.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{profile.location}</div>}
            {profile.company  && <div className="flex items-center gap-2"><Briefcase className="h-4 w-4" />{profile.company}</div>}
            {profile.school   && <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />{profile.school}</div>}
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Joined {memberSince}</div>
          </div>

          <div className="flex gap-3">
            {profile.githubUrl   && <a href={profile.githubUrl}   target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-100"><Github className="h-5 w-5" /></a>}
            {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-100"><Linkedin className="h-5 w-5" /></a>}
            {profile.twitterUrl  && <a href={profile.twitterUrl}  target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-100"><Twitter className="h-5 w-5" /></a>}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="bg-zinc-900 rounded-lg p-3 text-center border border-zinc-800">
              <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1"><Flame className="h-4 w-4" /></div>
              <p className="text-xl font-bold text-zinc-100">{s.currentStreak}</p>
              <p className="text-xs text-zinc-500">Day streak</p>
              <p className="text-xs text-zinc-600 mt-0.5">Best: {s.longestStreak}</p>
            </div>
            <div className="bg-zinc-900 rounded-lg p-3 text-center border border-zinc-800">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-1"><Trophy className="h-4 w-4" /></div>
              <p className="text-xl font-bold text-zinc-100">
                {s.ranking ? `#${s.ranking.toLocaleString()}` : "—"}
              </p>
              <p className="text-xs text-zinc-500">Global rank</p>
            </div>
          </div>
        </div>

        {/* ── Main content ──────────────────────────────── */}
        <div className="md:col-span-3 space-y-6">

          {/* Activity heatmap */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-300">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityHeatmap data={s.heatmap} />
            </CardContent>
          </Card>

          {/* Solved + languages in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-300">Problems Solved</CardTitle>
              </CardHeader>
              <CardContent>
                <SolvedDonut
                  easy={s.easySolved} medium={s.mediumSolved}
                  hard={s.hardSolved} total={s.totalSolved}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-300">Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <LanguageBar data={s.languageBreakdown} />
              </CardContent>
            </Card>
          </div>

          {/* Tags + recent AC in a row */}
          {s.topTags.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-300">Top Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <TagBarChart data={s.topTags} />
              </CardContent>
            </Card>
          )}

          {/* Contest rating */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-300">Contest Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <RatingGraph username={profile.username} />
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-300">Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <BadgeGrid badges={s.badges} />
            </CardContent>
          </Card>

          {/* Recent accepted submissions */}
          {s.recentAc.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-300">Recent Accepted</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-zinc-800">
                  {s.recentAc.slice(0, 10).map(sub => (
                    <div key={sub.id} className="flex items-center gap-3 px-5 py-2.5 text-sm hover:bg-zinc-900/50 transition-colors">
                      <Clock className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" />
                      <Link href={`/problems/${sub.problemSlug}`}
                        className="flex-1 hover:text-emerald-400 transition-colors truncate">
                        <span className="text-zinc-500 mr-1">{sub.problemNumber}.</span>
                        {sub.problemTitle}
                      </Link>
                      <span className="text-zinc-500 text-xs capitalize">{sub.language}</span>
                      {sub.runtimeMs != null && (
                        <span className="text-zinc-600 text-xs">{sub.runtimeMs}ms</span>
                      )}
                      <span className="text-zinc-600 text-xs hidden sm:block">
                        {new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
