"use client";

import { useState } from "react";
import { Check, GraduationCap, Trophy, X } from "lucide-react";
import type { Evaluation } from "@/lib/engine";
import type { Challenge } from "@/lib/challenges";

export function Execution({ result, challenge, onResult, onLearn }: { result: Evaluation; challenge: Challenge; onResult: () => void; onLearn: () => void }) {
  const [selected, setSelected] = useState(0);
  const item = result.tests[Math.min(selected, result.tests.length - 1)];
  return <section className="execution-results" aria-label="Resultados de ejecución" aria-live="polite">
    <div className="execution-heading"><div><strong>Ejecución terminada</strong><span>{result.passed} / {result.total} tests pasaron</span></div><span className={result.passed === result.total ? "test-pass" : "test-fail"}>{result.passed === result.total ? "Solución aceptada" : "Hay casos por revisar"}</span></div>
    {result.tests.length > 0 ? <><div className="test-selector" aria-label="Casos ejecutados">{result.tests.map((test,index) => <button key={test.label} className={`${test.passed ? "passed" : "failed"} ${selected === index ? "active" : ""}`} onClick={() => setSelected(index)} aria-pressed={selected === index} aria-label={`Caso ${index+1}: ${test.passed ? "pasó" : "falló"}`}>{test.passed ? <Check size={12}/> : <X size={12}/>} {index+1}</button>)}</div>{item && <div className="execution-case"><div><span>Entrada</span><code>{item.input !== undefined ? JSON.stringify(item.input) : "No disponible en esta partida anterior"}{item.target !== undefined ? `, objetivo = ${item.target}` : ""}{item.other !== undefined ? `, segunda palabra = ${JSON.stringify(item.other)}` : ""}</code></div><div><span>Tu resultado</span><code className={item.passed ? "test-pass" : "test-fail"}>{item.actual !== undefined ? JSON.stringify(item.actual) : item.passed ? "Correcto" : "Incorrecto"}</code></div><div><span>{challenge.kind === "two-sum" ? "Salida válida" : "Esperado"}</span><code>{item.expected !== undefined ? JSON.stringify(item.expected) : "No disponible"}</code></div>{item.reason && <p className="test-fail">{item.reason}</p>}</div>}</> : <p className="execution-empty">{result.feedback[0]}</p>}
    <div className="execution-actions"><button className="secondary" onClick={onResult}><Trophy size={14}/> Ver puntaje</button><button className="primary" onClick={onLearn}><GraduationCap size={14}/> Entender por qué</button></div>
  </section>;
}
