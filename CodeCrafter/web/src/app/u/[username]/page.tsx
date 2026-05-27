import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Github, Linkedin, Twitter, MapPin, Briefcase, GraduationCap, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

interface Stats {
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSolved: number;
  currentStreak: number;
  longestStreak: number;
  ranking: number;
  reputation: number;
}

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
  stats: Stats;
  memberSince: string;
}

async function getProfile(username: string): Promise<PublicProfile | null> {
  const res = await fetch(`${BACKEND}/api/v1/u/${username}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const profile = await getProfile(params.username);
  if (!profile) return { title: "User not found — CodeCrafter" };
  return {
    title: `${profile.displayName ?? profile.username} (@${profile.username}) — CodeCrafter`,
    description: profile.bio ?? `${profile.username}'s CodeCrafter profile`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const profile = await getProfile(params.username);
  if (!profile) notFound();

  const memberSince = new Date(profile.memberSince).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: avatar + bio */}
        <div className="space-y-4">
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
            {profile.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {profile.location}
              </div>
            )}
            {profile.company && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {profile.company}
              </div>
            )}
            {profile.school && (
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                {profile.school}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Joined {memberSince}
            </div>
          </div>

          <div className="flex gap-3">
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-100">
                <Github className="h-5 w-5" />
              </a>
            )}
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-100">
                <Linkedin className="h-5 w-5" />
              </a>
            )}
            {profile.twitterUrl && (
              <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-100">
                <Twitter className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        {/* Right: stats */}
        <div className="md:col-span-2 space-y-6">
          {/* Solved summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Problems Solved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-zinc-100">{profile.stats.totalSolved}</p>
                  <p className="text-xs text-zinc-400 mt-1">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{profile.stats.easySolved}</p>
                  <p className="text-xs text-zinc-400 mt-1">Easy</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">{profile.stats.mediumSolved}</p>
                  <p className="text-xs text-zinc-400 mt-1">Medium</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">{profile.stats.hardSolved}</p>
                  <p className="text-xs text-zinc-400 mt-1">Hard</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Streak + ranking */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-emerald-400">{profile.stats.currentStreak}</p>
                <p className="text-xs text-zinc-400 mt-1">Day Streak</p>
                <p className="text-xs text-zinc-500 mt-1">Best: {profile.stats.longestStreak}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-zinc-100">
                  {profile.stats.ranking > 0 ? `#${profile.stats.ranking.toLocaleString()}` : "—"}
                </p>
                <p className="text-xs text-zinc-400 mt-1">Global Rank</p>
              </CardContent>
            </Card>
          </div>

          {/* Preferred languages */}
          {profile.preferredLanguages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.preferredLanguages.map((lang) => (
                    <span
                      key={lang}
                      className="px-3 py-1 rounded-full text-xs bg-zinc-800 text-zinc-300 border border-zinc-700"
                    >
                      {lang}
                    </span>
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
