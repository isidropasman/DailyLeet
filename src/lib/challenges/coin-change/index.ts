import type { ChallengeModule } from "../module";
import { activeSteps, definition } from "./definition";
import { program, typescript } from "./program";
import { python } from "./python";
import { java } from "./java";
import { cpp } from "./cpp";
import { explanation } from "./explanation";

const json = (value: string | number[]) => JSON.stringify(value).replaceAll(",", ", ");

export const coinChange: ChallengeModule = {
  definition, activeSteps, program, typescript, python, java, cpp, explanation,
  signature: [{ name: "coins", role: "input", ts: "number[]" }, { name: "amount", role: "target", ts: "number" }],
  formatCase: item => `${json(item.input)}, amount = ${item.target ?? 0}`,
};
