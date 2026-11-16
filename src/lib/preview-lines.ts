import { activeSteps, type Choices, type Kind } from "./challenges";

export type Line = string | false | null | undefined | readonly Line[];

export function flat(...lines: Line[]): string[] {
  return lines.flatMap(line => (Array.isArray(line) ? flat(...line) : typeof line === "string" ? [line] : []));
}

export function indent(...lines: Line[]): string[] {
  return flat(...lines).map(line => (line === "" ? line : `    ${line}`));
}

export function render(...lines: Line[]): string {
  return flat(...lines).join("\n");
}

// Steps an approach ignores are pinned to 0 so a pending (-1) choice there never leaks into the preview.
export function activeChoices(kind: Kind, choices: Choices): Choices {
  const [approach] = choices;
  if (approach < 0) return [approach, -1, -1];
  const active = activeSteps(kind, approach);
  return [approach, active.includes(1) ? choices[1] : 0, active.includes(2) ? choices[2] : 0];
}
