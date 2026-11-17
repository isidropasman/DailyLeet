import type { ChallengeModule } from "../module";
import { activeSteps, definition } from "./definition";
import { program, typescript } from "./program";
import { python } from "./python";
import { java } from "./java";
import { cpp } from "./cpp";
import { explanation } from "./explanation";

const pairs = (input: string | number[]) => {
  if (typeof input === "string") return JSON.stringify(input);
  const intervals: string[] = [];
  for (let i = 0; i + 1 < input.length; i += 2) intervals.push(`[${input[i]}, ${input[i + 1]}]`);
  return `[${intervals.join(", ")}]`;
};

export const mergeIntervals: ChallengeModule = {
  definition, activeSteps, program, typescript, python, java, cpp, explanation,
  signature: [{ name: "intervals", role: "input", ts: "number[]" }],
  formatCase: item => pairs(item.input),
};
