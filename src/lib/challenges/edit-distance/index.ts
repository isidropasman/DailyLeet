import type { ChallengeModule } from "../module";
import { activeSteps, definition } from "./definition";
import { program, typescript } from "./program";
import { python } from "./python";
import { java } from "./java";
import { cpp } from "./cpp";
import { explanation } from "./explanation";

export const editDistance: ChallengeModule = {
  definition, activeSteps, program, typescript, python, java, cpp, explanation,
  signature: [{ name: "a", role: "input", ts: "string" }, { name: "b", role: "other", ts: "string" }],
  formatCase: item => `a = ${JSON.stringify(item.input)}, b = ${JSON.stringify(item.other ?? "")}`,
};
