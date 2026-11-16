"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";

const keywords = "function|const|let|if|else|for|while|return|new|do|true|false|undefined|number|string|def|in|not|and|or|None|True|False|pass|raise|class|public|private|static|int|bool|boolean|char|auto|void|throw|switch|case|default|break|continue|import|include";
const keyword = new RegExp(`^(?:${keywords})$`);
const words = new RegExp(`("[^"\\n]*"|'[^'\\n]*'|\\b(?:${keywords})\\b|\\b\\d+\\b)`, "g");

// `context` changes (another language or challenge) rewrite every line; those aren't the player's edits.
export function useChangedLines(source: string, context: string): number[] {
  const previous = useRef({ source, context });
  const [changed, setChanged] = useState<number[]>([]);
  useEffect(() => {
    const before = previous.current;
    previous.current = { source, context };
    if (before.context !== context) { setChanged([]); return; }
    const oldLines = before.source.split("\n");
    setChanged(source.split("\n").flatMap((line, index) => line !== oldLines[index] ? [index] : []));
  }, [source, context]);
  return changed;
}

function Line({ text, number, highlighted }: { text: string; number: number; highlighted: boolean }) {
  return <div className={`code-line ${highlighted ? "code-changed" : ""}`}><span className="line-number" aria-hidden="true">{number}</span><span>{text.split(words).map((part, i) => <span key={i} className={/^["']/.test(part) ? "syntax-string" : keyword.test(part) ? "syntax-keyword" : /^\d+$/.test(part) ? "syntax-number" : undefined}>{part || " "}</span>)}</span></div>;
}

export function CodeBlock({ source, highlighted, label, scrollToHighlight = false }: { source: string; highlighted: number[]; label: string; scrollToHighlight?: boolean }) {
  const container = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (!scrollToHighlight) return;
    const line = container.current?.querySelector<HTMLElement>(".code-changed");
    if (line && container.current) container.current.scrollTop = Math.max(0, line.offsetTop - container.current.offsetTop - 45);
  }, [highlighted, scrollToHighlight]);
  return <pre ref={container} className="code" tabIndex={0} aria-label={label}><code>{source.split("\n").map((line, index) => <Line key={index} text={line} number={index + 1} highlighted={highlighted.includes(index)}/>)}</code></pre>;
}

const PEEK_LINES = 7;

// Phones stack the code under the decisions, so each choice gets a short excerpt of what it changed.
export function CodePeek({ source, changed, follow, onExpand }: { source: string; changed: number[]; follow: boolean; onExpand: () => void }) {
  const box = useRef<HTMLElement>(null);
  useEffect(() => {
    if (follow && changed.length > 0 && window.matchMedia("(max-width: 760px)").matches) box.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [changed, follow]);
  if (changed.length === 0) return null;
  const lines = source.split("\n");
  const first = Math.max(0, changed[0] - 1);
  const last = Math.min(lines.length - 1, first + PEEK_LINES - 1, changed[changed.length - 1] + 1);
  return <section ref={box} className="code-peek" aria-label="Cambios en tu código">
    <div className="code-peek-head"><span>Así cambió tu código</span><button type="button" className="text-button" onClick={onExpand}>Ver completo <ArrowDown size={13}/></button></div>
    <pre className="code"><code>{lines.slice(first, last + 1).map((line, offset) => <Line key={first + offset} text={line} number={first + offset + 1} highlighted={changed.includes(first + offset)}/>)}</code></pre>
  </section>;
}
