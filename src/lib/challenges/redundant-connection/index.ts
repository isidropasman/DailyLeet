import type { ChallengeModule } from "../module";
import { activeSteps, definition } from "./definition";
import { program, typescript } from "./program";
import { python } from "./python";
import { java } from "./java";
import { cpp } from "./cpp";
import { explanation } from "./explanation";

const pairsOf = (flat: number[]) => flat.flatMap((value, index) => (index % 2 === 0 ? [[value, flat[index + 1]]] : []));
const json = (value: unknown) => JSON.stringify(value).replaceAll(",", ", ");

export const redundantConnection: ChallengeModule = {
  definition, activeSteps, program, typescript, python, java, cpp, explanation,
  signature: [{ name: "edges", role: "input", ts: "number[]" }],
  formatCase: item => json(Array.isArray(item.input) ? pairsOf(item.input) : []),
};
