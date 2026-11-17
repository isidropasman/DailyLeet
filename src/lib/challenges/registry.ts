import type { ChallengeModule } from "./module";
import { dailyTemperatures } from "./daily-temperatures";
import { subarraySum } from "./subarray-sum";
import { minWindow } from "./min-window";
import { koko } from "./koko";
import { meetingRooms } from "./meeting-rooms";
import { largestRectangle } from "./largest-rectangle";
import { courseSchedule } from "./course-schedule";
import { editDistance } from "./edit-distance";
import { coinChange } from "./coin-change";
import { lis } from "./lis";
import { lruCache } from "./lru-cache";
import { redundantConnection } from "./redundant-connection";
import { networkDelay } from "./network-delay";
import { medianStream } from "./median-stream";
import { maxSubarray } from "./max-subarray";
import { containerWater } from "./container-water";

// Client-safe registry. Adding a challenge: one line here and one in ./judges.ts (TypeScript enforces the second).
export const modules = {
  "daily-temperatures": dailyTemperatures,
  "subarray-sum": subarraySum,
  "min-window": minWindow,
  koko,
  "meeting-rooms": meetingRooms,
  "largest-rectangle": largestRectangle,
  "course-schedule": courseSchedule,
  "edit-distance": editDistance,
  "coin-change": coinChange,
  lis,
  "lru-cache": lruCache,
  "redundant-connection": redundantConnection,
  "network-delay": networkDelay,
  "median-stream": medianStream,
  "max-subarray": maxSubarray,
  "container-water": containerWater,
} satisfies Record<string, ChallengeModule>;

export type ModuleKind = keyof typeof modules;
