import type { Challenge, Choices } from "../challenges";
import type { Case, Output } from "../engine";
import type { CaseInput, Explanation } from "../explanation-types";
import { flat, type Line } from "../preview-lines";

export type Role = "input" | "target" | "other";
export type Param = { name: string; role: Role; ts: string };

// Client-safe half of a challenge: everything the browser needs to render, preview and explain it.
// Hidden cases and the pass/fail contract live in the Judge (cases.ts) so they never reach the client bundle.
export type ChallengeModule = {
  definition: Omit<Challenge, "kind">;
  activeSteps: (approach: number) => number[];
  signature: Param[];
  // JS body executed by the engine. It receives choices with ignored steps pinned to 0 and may receive -1
  // (pending) for previews, which must render as `/* Pendiente: … */` or `/* Elegí … */`.
  program: (choices: Choices) => string;
  // Exact string replacements that turn the JS body into the TypeScript preview (type annotations only).
  typescript: [from: string, to: string][];
  python: (choices: Choices) => string;
  java: (choices: Choices) => string;
  cpp: (choices: Choices) => string;
  explanation: Explanation;
  formatCase: (item: CaseInput) => string;
};

export type CaseVerdict = { passed: true } | { passed: false; reason?: string };

export type Judge = {
  cases: Case[];
  efficient: (choices: Choices) => boolean;
  // Defaults to deep equality against `expected`. Override for order-insensitive or "any valid answer" outputs,
  // or to enforce contracts such as mutating the input in place.
  compare?: (actual: Output, item: Case, execution: { inPlace: boolean }) => CaseVerdict;
  feedback: { optimal: string; slow: string; hint: string };
};

export const option = (title: string, detail: string) => ({ title, detail });

export function jsBlock(head: string, ...body: Line[]): string[] {
  return [`${head} {`, ...flat(...body).map(line => (line === "" ? line : `  ${line}`)), "}"];
}

export const jsPending = (text: string) => `/* Pendiente: ${text} */`;
export const jsChooseApproach = "/* Elegí un enfoque para empezar a construir. */";
