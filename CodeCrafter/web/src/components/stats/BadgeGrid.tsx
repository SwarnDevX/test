"use client";

import { useState } from "react";
import type { BadgeDto } from "@/types/stats";

interface Props { badges: BadgeDto[] }

export function BadgeGrid({ badges }: Props) {
  const [hovered, setHovered] = useState<BadgeDto | null>(null);

  if (!badges.length) return (
    <p className="text-xs text-zinc-500">No badges earned yet. Start solving!</p>
  );

  return (
    <div className="flex flex-wrap gap-3">
      {badges.map(b => (
        <div key={b.slug}
          className="relative group cursor-pointer"
          onMouseEnter={() => setHovered(b)}
          onMouseLeave={() => setHovered(null)}>
          <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl hover:border-emerald-500 transition-colors">
            {b.icon ?? "🏅"}
          </div>

          {hovered?.slug === b.slug && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 w-48 p-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl pointer-events-none">
              <p className="text-xs font-semibold text-zinc-100 mb-0.5">{b.name}</p>
              <p className="text-xs text-zinc-400 leading-snug">{b.description}</p>
              <p className="text-xs text-zinc-600 mt-1">
                {new Date(b.awardedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
