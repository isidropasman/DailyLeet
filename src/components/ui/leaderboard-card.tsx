"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { LeaderboardPodium, type LeaderboardRanking } from "@/components/ui/leaderboard-podium";
import { LeaderboardRankings, type LeaderboardRankingItem } from "@/components/ui/leaderboard-rankings";
import { cn } from "@/lib/utils";

export interface LeaderboardRunOption { id: string; label: string }
export interface LeaderboardCardProps extends HTMLAttributes<HTMLDivElement> {
  fromDate: string;
  toDate: string;
  podiumRankings: LeaderboardRanking[];
  rankings: LeaderboardRankingItem[];
  currentUserId?: string;
  runOptions: LeaderboardRunOption[];
  selectedRunId: string;
  onRunChange: (id: string) => void;
}

const formatDate = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });

export const LeaderboardCard = forwardRef<HTMLDivElement, LeaderboardCardProps>(function LeaderboardCard({ className, fromDate, toDate, podiumRankings, rankings, currentUserId, runOptions, selectedRunId, onRunChange, ...props }, ref) {
  return <div ref={ref} className={cn("ranking-card", className)} {...props}>
    <div className="ranking-period"><span>{fromDate === toDate ? formatDate(fromDate) : `${formatDate(fromDate)} – ${formatDate(toDate)}`} · UTC</span><div className="ranking-period-tabs" role="group" aria-label="Período del ranking">{runOptions.map(option => <button key={option.id} type="button" aria-pressed={selectedRunId === option.id} onClick={() => onRunChange(option.id)}>{option.label}</button>)}</div></div>
    {rankings.length ? <><LeaderboardPodium size="sm" className="ranking-podium" rankings={podiumRankings}/><LeaderboardRankings rankings={rankings} currentUserId={currentUserId}/></> : <div className="empty-state"><h3>La primera posición está libre.</h3><p>Terminá el desafío y estrená el ranking.</p></div>}
  </div>;
});
