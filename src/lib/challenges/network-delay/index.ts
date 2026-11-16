import type { ChallengeModule } from "../module";
import { activeSteps, definition } from "./definition";
import { program, typescript } from "./program";
import { python } from "./python";
import { java } from "./java";
import { cpp } from "./cpp";
import { explanation } from "./explanation";

const triplesOf = (flat: number[]) => flat.flatMap((value, index) => (index % 3 === 0 ? [[value, flat[index + 1], flat[index + 2]]] : []));
const json = (value: unknown) => JSON.stringify(value).replaceAll(",", ", ");

export const networkDelay: ChallengeModule = {
  definition, activeSteps, program, typescript, python, java, cpp, explanation,
  signature: [{ name: "links", role: "input", ts: "number[]" }, { name: "n", role: "target", ts: "number" }],
  formatCase: item => {
    const [k = 0, ...links] = Array.isArray(item.input) ? item.input : [];
    return `n = ${item.target ?? 0}, k = ${k}, ${json(triplesOf(links))}`;
  },
};
