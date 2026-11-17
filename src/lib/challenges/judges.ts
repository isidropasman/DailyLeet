import type { Judge } from "./module";
import type { ModuleKind } from "./registry";
import { dailyTemperaturesJudge } from "./daily-temperatures/cases";
import { subarraySumJudge } from "./subarray-sum/cases";
import { minWindowJudge } from "./min-window/cases";
import { kokoJudge } from "./koko/cases";
import { meetingRoomsJudge } from "./meeting-rooms/cases";
import { largestRectangleJudge } from "./largest-rectangle/cases";
import { courseScheduleJudge } from "./course-schedule/cases";
import { editDistanceJudge } from "./edit-distance/cases";
import { coinChangeJudge } from "./coin-change/cases";
import { lisJudge } from "./lis/cases";
import { lruCacheJudge } from "./lru-cache/cases";
import { redundantConnectionJudge } from "./redundant-connection/cases";
import { networkDelayJudge } from "./network-delay/cases";
import { medianStreamJudge } from "./median-stream/cases";
import { maxSubarrayJudge } from "./max-subarray/cases";
import { containerWaterJudge } from "./container-water/cases";
import { mergeIntervalsJudge } from "./merge-intervals/cases";
import { rotatedMinJudge } from "./rotated-min/cases";
import { rottingOrangesJudge } from "./rotting-oranges/cases";

// Server-only: hidden cases and pass/fail contracts. Import it only from engine.ts so cases stay out of the client bundle.
export const judges: Record<ModuleKind, Judge> = {
  "daily-temperatures": dailyTemperaturesJudge,
  "subarray-sum": subarraySumJudge,
  "min-window": minWindowJudge,
  koko: kokoJudge,
  "meeting-rooms": meetingRoomsJudge,
  "largest-rectangle": largestRectangleJudge,
  "course-schedule": courseScheduleJudge,
  "edit-distance": editDistanceJudge,
  "coin-change": coinChangeJudge,
  lis: lisJudge,
  "lru-cache": lruCacheJudge,
  "redundant-connection": redundantConnectionJudge,
  "network-delay": networkDelayJudge,
  "median-stream": medianStreamJudge,
  "max-subarray": maxSubarrayJudge,
  "container-water": containerWaterJudge,
  "merge-intervals": mergeIntervalsJudge,
  "rotated-min": rotatedMinJudge,
  "rotting-oranges": rottingOrangesJudge,
};
