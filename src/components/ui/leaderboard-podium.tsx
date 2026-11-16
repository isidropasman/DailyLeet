"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LeaderboardRanking {
  userId: string;
  userName: string | null;
  rank: number;
  value: number;
  avatarUrl?: string | null;
}

export const podiumVariants = cva("flex items-end justify-center gap-4", {
  variants: { size: { sm: "gap-2", default: "gap-4", lg: "gap-6" } },
  defaultVariants: { size: "default" },
});

export interface LeaderboardPodiumProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof podiumVariants> {
  rankings: LeaderboardRanking[];
  showValue?: boolean;
  showAvatar?: boolean;
  medalStyle?: "classic" | "modern" | "minimal";
}

const styles = {
  1: { color: "text-rank-1", bg: "bg-rank-1/60", height: ["h-24", "h-32", "h-40"] },
  2: { color: "text-rank-2", bg: "bg-rank-2/30", height: ["h-20", "h-24", "h-32"] },
  3: { color: "text-rank-3", bg: "bg-rank-3/50", height: ["h-16", "h-20", "h-28"] },
} as const;

export const LeaderboardPodium = forwardRef<HTMLDivElement, LeaderboardPodiumProps>(function LeaderboardPodium(
  { className, size, rankings, showValue = true, showAvatar = true, medalStyle = "classic", ...props }, ref,
) {
  const ordered = [2, 1, 3].flatMap(rank => rankings.slice(0, 3).filter(entry => entry.rank === rank));
  if (!ordered.length) return null;
  const sizeIndex = size === "sm" ? 0 : size === "lg" ? 2 : 1;
  return <div ref={ref} className={cn(podiumVariants({ size }), className)} role="list" aria-label="Podio del ranking" {...props}>
    {ordered.map(entry => {
      const config = styles[entry.rank as 1 | 2 | 3];
      const name = entry.userName || `Jugador ${entry.userId.slice(0, 6)}`;
      return <div key={entry.userId} role="listitem" aria-label={`${entry.rank}º: ${name}${showValue ? `, ${entry.value} puntos` : ""}`} className="flex min-w-0 flex-col items-center">
        <div className={cn("relative mb-2 flex items-center justify-center rounded-full", config.bg, size === "sm" ? "h-10 w-10" : size === "lg" ? "h-20 w-20" : "h-14 w-14")} aria-hidden="true">
          {showAvatar && entry.avatarUrl ? <img src={entry.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : <Crown className={cn("h-5 w-5", config.color)} />}
          {showAvatar && entry.avatarUrl && medalStyle !== "minimal" && <Crown className={cn("absolute -right-1 -bottom-1 h-5 w-5", config.color)} />}
        </div>
        <span className="max-w-24 truncate text-center text-sm font-medium" title={name}>{name}</span>
        {showValue && <span className="text-xs text-slate-500 tabular-nums">{entry.value} pts</span>}
        <div aria-hidden="true" className={cn("mt-2 w-20 rounded-t-lg text-center text-sm font-bold", config.bg, config.color, config.height[sizeIndex], medalStyle === "modern" && "rounded-t-xl")}><span className="inline-block pt-2">{entry.rank}</span></div>
      </div>;
    })}
  </div>;
});
