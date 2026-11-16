"use client";

import { useState } from "react";
import { Check, Flame, GraduationCap, Share2 } from "lucide-react";
import type { Evaluation } from "@/lib/engine";

type Mode = "daily" | "practice" | "test";

const verdict = (result: Evaluation) => result.passed < result.total ? { label: "Incorrecta", tone: "bad" } : result.efficient ? { label: "Óptima", tone: "good" } : { label: "Correcta, mejorable", tone: "slow" };

export function ResultCard({ result, title, mode, elapsed, rank, streak, onShare, onLearn, onCases }: { result: Evaluation; title: string; mode: Mode; elapsed: number | null; rank: { rank: number; total: number } | null; streak: number; onShare: () => Promise<"shared" | "copied" | "failed">; onLearn: () => void; onCases: () => void }) {
  const [shared, setShared] = useState<"shared" | "copied" | null>(null);
  const { label, tone } = verdict(result);
  const details = [`${result.passed}/${result.total} casos`, elapsed === null ? null : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`, rank ? `#${rank.rank.toLocaleString("es-AR")} de ${rank.total.toLocaleString("es-AR")} hoy` : null].filter(item => item !== null);
  return <div className="result-card">
    <span className="result-kicker">{mode === "practice" ? "Práctica" : mode === "test" ? "Prueba privada" : "Desafío diario"} · {title}</span>
    <h2 id="modal-title">Tu puntaje</h2>
    <div className="score-total result-score" aria-label="Puntaje de la solución"><strong>{result.score}</strong><span>/ 100</span></div>
    <span className={`result-verdict ${tone}`}>{label}</span>
    <div className="result-cases" aria-hidden="true">{result.tests.map(test => <i key={test.label} className={test.passed ? "pass" : "fail"}/>)}</div>
    <p className="result-line">{details.join(" · ")}{streak > 0 && mode === "daily" && <span className="result-streak"><Flame size={13}/> {streak}</span>}</p>
    {result.breakdown && <div className="score-breakdown"><span>Corrección <strong>{result.breakdown.correctness} / 90</strong></span><span>Eficiencia <strong>{result.breakdown.efficiency} / 7</strong></span><span>Tiempo <strong>{result.breakdown.time} / 3</strong></span></div>}
    <div className="result-actions">
      <button className="primary" onClick={() => void onShare().then(outcome => setShared(outcome === "failed" ? null : outcome))}>{shared ? <Check size={15}/> : <Share2 size={15}/>} {shared === "copied" ? "Copiado" : shared === "shared" ? "Compartido" : "Compartir"}</button>
      <button className="secondary learn-button" onClick={onLearn}><GraduationCap size={15}/> Entender por qué</button>
    </div>
    <button className="text-button result-cases-link" onClick={onCases}>Ver los casos de prueba</button>
  </div>;
}
