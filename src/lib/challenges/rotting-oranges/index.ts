import type { ChallengeModule } from "../module";
import { activeSteps, definition } from "./definition";
import { program, typescript } from "./program";
import { python } from "./python";
import { java } from "./java";
import { cpp } from "./cpp";
import { explanation } from "./explanation";

const rowsOf = (flat: number[], cols: number) => flat.flatMap((_, index) => (index % cols === 0 ? [flat.slice(index, index + cols)] : []));
const json = (value: unknown) => JSON.stringify(value).replaceAll(",", ", ");

export const rottingOranges: ChallengeModule = {
  definition, activeSteps, program, typescript, python, java, cpp, explanation,
  signature: [{ name: "grid", role: "input", ts: "number[]" }, { name: "cols", role: "target", ts: "number" }],
  formatCase: item => json(Array.isArray(item.input) ? rowsOf(item.input, Math.max(1, item.target ?? 1)) : []),
};
