import { isModuleKind, type Choices, type Kind, type LegacyKind } from "./challenges";
import { modules, type ModuleKind } from "./challenges/registry";
import { activeChoices } from "./preview-lines";
import { cppPreview } from "./cpp-preview";
import { javaPreview } from "./java-preview";
import { previewCode } from "./program";
import { pythonPreview } from "./python-preview";

export type PreviewLanguage = "typescript" | "javascript" | "python" | "java" | "cpp";

export const previewLanguages: { id: PreviewLanguage; label: string; badge: string; file: string }[] = [
  { id: "typescript", label: "TypeScript", badge: "TS", file: "solution.ts" },
  { id: "javascript", label: "JavaScript", badge: "JS", file: "solution.js" },
  { id: "python", label: "Python", badge: "PY", file: "solution.py" },
  { id: "java", label: "Java", badge: "JV", file: "Solution.java" },
  { id: "cpp", label: "C++", badge: "C++", file: "solution.cpp" },
];

export function isPreviewLanguage(value: string): value is PreviewLanguage {
  return previewLanguages.some(language => language.id === value);
}

function javascriptPreview(kind: LegacyKind, choices: Choices): string {
  return previewCode(kind, choices)
    .replace(/: (?:number\[\]|string\[\]|\[number, number\]\[\]|Record<string, string>|number|string)(?=[,) ;=])/g, "")
    .replace(/new (Map|Set)<[^>]+>\(\)/g, "new $1()")
    .replace(/(\.get\([^)]*\))!(?=\s*\+)/g, "$1");
}

// The JS preview is the executed body minus tracing, so what the player reads is exactly what the engine runs.
function moduleScript(kind: ModuleKind, choices: Choices, typed: boolean): string {
  const challenge = modules[kind];
  let body = challenge.program(choices).split("\n").filter(line => !/^\s*(?:emit\(|tick\(\);\s*$)/.test(line)).join("\n");
  if (typed) for (const [from, to] of challenge.typescript) body = body.replaceAll(from, to);
  const params = challenge.signature.map(param => (typed ? `${param.name}: ${param.ts}` : param.name)).join(", ");
  return `function solve(${params}) {\n${body.split("\n").map(line => (line === "" ? line : `  ${line}`)).join("\n")}\n}`;
}

function modulePreview(kind: ModuleKind, choices: Choices, language: PreviewLanguage): string {
  const effective = activeChoices(kind, choices);
  switch (language) {
    case "typescript": return moduleScript(kind, effective, true);
    case "javascript": return moduleScript(kind, effective, false);
    case "python": return modules[kind].python(effective);
    case "java": return modules[kind].java(effective);
    case "cpp": return modules[kind].cpp(effective);
  }
}

export function previewInLanguage(kind: Kind, choices: Choices, language: PreviewLanguage): string {
  if (isModuleKind(kind)) return modulePreview(kind, choices, language);
  switch (language) {
    case "typescript": return previewCode(kind, choices);
    case "javascript": return javascriptPreview(kind, choices);
    case "python": return pythonPreview(kind, choices);
    case "java": return javaPreview(kind, choices);
    case "cpp": return cppPreview(kind, choices);
  }
}
