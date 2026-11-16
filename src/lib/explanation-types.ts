import type { Choices } from "./challenges";

export type Verdict = "óptima" | "correcta pero más lenta" | "incorrecta";
export type Cost = { time: string; space: string };
export type CaseInput = { input: string | number[]; target?: number; other?: string };
type SoundOption = { verdict: "óptima" | "correcta pero más lenta"; why: string };
type BrokenOption = { verdict: "incorrecta"; why: string; counterexample: CaseInput & { trace: string } };
export type OptionExplanation = SoundOption | BrokenOption;
type Four<T> = [T, T, T, T];

// Verdicts and counterexamples describe what happens when ONLY that decision deviates from `optimal`.
// tests/explanations.test.ts runs the engine to keep every claim honest.
export type Explanation = {
  optimal: Choices;
  notation: string;
  cost: (choices: Choices) => Cost;
  // Which stated time complexities count as optimal. The engine's `efficient` flag must agree with it on every
  // passing combination. Defaults to /^O\(n\)/, which is wrong for e.g. binary search on the answer or Dijkstra.
  optimalTime?: RegExp;
  keyIdea: { summary: string; detail: string };
  steps: [Four<OptionExplanation>, Four<OptionExplanation>, Four<OptionExplanation>];
  tradeOffs: { title: string; detail: string }[];
  pattern: { heuristic: string; detail: string };
  related: { title: string; url: string }[];
  interview: { question: string; answer: string };
};

export const broken = (why: string, input: CaseInput["input"], trace: string, extra: Omit<CaseInput, "input"> = {}): BrokenOption =>
  ({ verdict: "incorrecta", why, counterexample: { input, ...extra, trace } });
