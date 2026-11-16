import { revalidateTag, unstable_cache } from "next/cache";
import { database } from "./db";
import { dailyBoard, dailyBuckets, qualifiesForBoard, weeklyBoard, weeklyBuckets, type Bucket, type Entry } from "./leaderboard";

// Short TTLs bound staleness for everyone; viewers always see their own fresh entry
// merged in (leadersFor), and top-50-changing submits revalidate the tag right away.
const BOARD_TTL_SECONDS = 5;
// The histogram only feeds rank numbers; it costs a scan of the day's index, so it
// refreshes less often than the top-50.
const HISTOGRAM_TTL_SECONDS = 15;

export type CachedBoard = { entries: Entry[]; generatedAt: number };

const dailyTag = (day: string) => `board:daily:${day}`;
const weeklyTag = (weekStart: string) => `board:weekly:${weekStart}`;

export function cachedDailyBoard(day: string): Promise<CachedBoard> {
  return unstable_cache(async () => ({ entries: await dailyBoard(database(), day), generatedAt: Date.now() }), ["board-daily", day], { tags: [dailyTag(day)], revalidate: BOARD_TTL_SECONDS })();
}

export function cachedWeeklyBoard(weekStart: string): Promise<CachedBoard> {
  return unstable_cache(async () => ({ entries: await weeklyBoard(database(), weekStart), generatedAt: Date.now() }), ["board-weekly", weekStart], { tags: [weeklyTag(weekStart)], revalidate: BOARD_TTL_SECONDS })();
}

export function cachedDailyBuckets(day: string): Promise<Bucket[]> {
  return unstable_cache(() => dailyBuckets(database(), day), ["buckets-daily", day], { revalidate: HISTOGRAM_TTL_SECONDS })();
}

export function cachedWeeklyBuckets(weekStart: string): Promise<Bucket[]> {
  return unstable_cache(() => weeklyBuckets(database(), weekStart), ["buckets-weekly", weekStart], { revalidate: HISTOGRAM_TTL_SECONDS })();
}

// Revalidating on every submit would turn a submit spike into a cache-miss spike; only
// submits that change the visible top-50 invalidate (stale-while-revalidate via "max").
export async function revalidateBoardsFor(day: string, weekStart: string, mine: { daily: Entry | null; weekly: Entry | null }): Promise<void> {
  const [daily, weekly] = await Promise.all([cachedDailyBoard(day), cachedWeeklyBoard(weekStart)]);
  if (mine.daily && qualifiesForBoard(daily.entries, mine.daily)) revalidateTag(dailyTag(day), "max");
  if (mine.weekly && qualifiesForBoard(weekly.entries, mine.weekly)) revalidateTag(weeklyTag(weekStart), "max");
}
