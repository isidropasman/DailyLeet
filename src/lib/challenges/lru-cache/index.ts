import type { ChallengeModule } from "../module";
import { activeSteps, definition } from "./definition";
import { program, typescript } from "./program";
import { python } from "./python";
import { java } from "./java";
import { cpp } from "./cpp";
import { explanation } from "./explanation";

function formatOps(ops: number[]): string {
  const calls: string[] = [];
  for (let i = 0; i + 2 < ops.length; i += 3) calls.push(ops[i] === 0 ? `get(${ops[i + 1]})` : `put(${ops[i + 1]}, ${ops[i + 2]})`);
  return calls.join(", ");
}

export const lruCache: ChallengeModule = {
  definition, activeSteps, program, typescript, python, java, cpp, explanation,
  signature: [{ name: "ops", role: "input", ts: "number[]" }, { name: "capacity", role: "target", ts: "number" }],
  formatCase: item => `cap = ${item.target ?? 0}: ${typeof item.input === "string" ? item.input : formatOps(item.input)}`,
};
