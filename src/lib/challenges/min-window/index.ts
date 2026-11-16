import type { ChallengeModule } from "../module";
import { activeSteps, definition } from "./definition";
import { program, typescript } from "./program";
import { python } from "./python";
import { java } from "./java";
import { cpp } from "./cpp";
import { explanation } from "./explanation";

export const minWindow: ChallengeModule = {
  definition, activeSteps, program, typescript, python, java, cpp, explanation,
  signature: [{ name: "s", role: "input", ts: "string" }, { name: "t", role: "other", ts: "string" }],
  formatCase: item => `s = ${JSON.stringify(item.input)}, t = ${JSON.stringify(item.other ?? "")}`,
};
