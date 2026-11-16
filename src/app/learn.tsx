"use client";

import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { activeSteps, isChoices, type Challenge, type Choices } from "@/lib/challenges";
import type { Evaluation } from "@/lib/engine";
import { explainResult, explanations, formatCase } from "@/lib/explanations";
import type { Verdict } from "@/lib/explanation-types";
import { isPreviewLanguage, previewInLanguage, previewLanguages, type PreviewLanguage } from "@/lib/language-preview";
import { CodeBlock } from "./code";

const tone: Record<Verdict | "válida con tu enfoque", string> = { "óptima": "good", "correcta pero más lenta": "slow", "incorrecta": "bad", "válida con tu enfoque": "slow" };
const statusLabel: Record<Verdict, string> = { "óptima": "Tu solución es óptima", "correcta pero más lenta": "Correcta, pero hay algo mejor", "incorrecta": "Tu solución falla en algunos casos" };

export function Learn({ challenge, choices, result, language, onLanguage, onBack, onPractice }: { challenge: Challenge; choices: Choices; result: Evaluation; language: PreviewLanguage; onLanguage: (language: PreviewLanguage) => void; onBack: () => void; onPractice: () => void }) {
  useEffect(() => { window.scrollTo({ top: 0 }); }, []);
  const content = explanations[challenge.kind];
  const optimal = content.optimal;
  const solution = explainResult(challenge.kind, choices, result);
  const built = isChoices(choices);
  const used = built ? activeSteps(challenge.kind, choices[0]) : [];
  const optimalUsed = activeSteps(challenge.kind, optimal[0]);
  const shown = challenge.steps.flatMap((_, index) => used.includes(index) || optimalUsed.includes(index) ? [index] : []);
  const optimalCost = content.cost(optimal);
  const optimalSource = previewInLanguage(challenge.kind, optimal, language);
  const mine = new Set(built ? previewInLanguage(challenge.kind, choices, language).split("\n").map(line => line.trim()) : []);
  const different = optimalSource.split("\n").flatMap((line, index) => line.trim() !== "" && !mine.has(line.trim()) ? [index] : []);
  const failure = solution?.failure;

  return <section className="learn" aria-label="Entender el ejercicio">
    <div className="learn-top"><button className="text-button" onClick={onBack}><ArrowLeft size={15}/> Volver al juego</button><span className="pill topic">{challenge.topic}</span></div>
    <header className="learn-hero">
      <span className="result-kicker">Entender el ejercicio</span>
      <h1>{challenge.title}</h1>
      {solution ? <div className={`learn-status ${tone[solution.status]}`}><strong>{statusLabel[solution.status]}</strong><p>{solution.headline}</p></div>
        : <div className="learn-status bad"><strong>No llegaste a armar una solución completa</strong><p>{result.feedback[0] ?? "Se terminó el tiempo antes de enviar."}</p></div>}
      <div className="learn-costs">
        {solution && <div><small>Tu versión</small><strong>{solution.cost.time}</strong><span>{solution.cost.space} de espacio</span></div>}
        <div className="optimal"><small>La óptima</small><strong>{optimalCost.time}</strong><span>{optimalCost.space} de espacio</span></div>
      </div>
    </header>

    <article className="learn-block">
      <h2><span>1</span> Qué se buscaba</h2>
      <p>{challenge.description}</p>
      <div className="learn-example"><div><small>Entrada</small><code>{challenge.example}</code></div><div><small>Salida</small><code>{challenge.expected}</code></div><p>{challenge.explanation}</p></div>
      <p className="learn-hint"><b>La pista para reconocerlo:</b> {content.pattern.heuristic}</p>
    </article>

    <article className="learn-block">
      <h2><span>2</span> La lógica detrás</h2>
      <p className="learn-lead">{content.keyIdea.summary}</p>
      <p>{content.keyIdea.detail}</p>
      <p>{content.pattern.detail}</p>
    </article>

    <article className="learn-block">
      <h2><span>3</span> Tu lógica vs la óptima</h2>
      <p className="learn-note">Cada decisión se compara cambiando solo esa pieza respecto de la solución óptima.</p>
      <ol className="learn-compare">{shown.map(index => {
        const step = challenge.steps[index];
        const mineActive = used.includes(index);
        const same = mineActive && optimalUsed.includes(index) && choices[index] === optimal[index];
        const mineDetail = mineActive ? content.steps[index][choices[index]] : null;
        const mineVerdict = solution?.choices[index]?.verdict ?? mineDetail?.verdict ?? null;
        const alternative: Choices = [...optimal];
        if (mineActive) alternative[index] = choices[index];
        const alternativeCost = mineDetail && mineDetail.verdict !== "incorrecta" ? content.cost(alternative) : null;
        return <li key={step.title} className={same ? "same" : mineVerdict === "incorrecta" ? "wrong" : "differs"}>
          <h3>{step.title} <small>{step.question}</small></h3>
          <div className="learn-pair">
            <div className="learn-mine"><small>Vos elegiste</small>{mineActive && mineDetail ? <><strong>{step.options[choices[index]].title}{mineVerdict && <span className={`explain-tag ${tone[mineVerdict]}`}>{mineVerdict}</span>}</strong><p>{mineDetail.why}</p>{mineDetail.verdict === "incorrecta" && <p className="learn-break"><X size={13}/> Se rompe con <code>{formatCase(challenge.kind, mineDetail.counterexample)}</code>. {mineDetail.counterexample.trace}</p>}</> : <p className="learn-muted">{built ? "Tu enfoque no usa esta decisión." : "Sin elegir."}</p>}</div>
            {same ? <div className="learn-optimal match"><Check size={15}/> <strong>Es la misma que la óptima.</strong></div>
              : optimalUsed.includes(index) ? <div className="learn-optimal"><small>Lo óptimo</small><strong>{step.options[optimal[index]].title}</strong><p>{content.steps[index][optimal[index]].why}</p>{alternativeCost && (alternativeCost.time !== optimalCost.time || alternativeCost.space !== optimalCost.space) && <p className="learn-delta">Con tu elección: <b>{alternativeCost.time}</b> · {alternativeCost.space}. Con la óptima: <b>{optimalCost.time}</b> · {optimalCost.space}.</p>}</div>
              : <div className="learn-optimal"><small>Lo óptimo</small><p>Con el enfoque óptimo esta decisión no hace falta.</p></div>}
          </div>
        </li>;
      })}</ol>
      {solution?.skipped && <p className="learn-note">{solution.skipped}</p>}
    </article>

    {failure && <article className="learn-block">
      <h2><span>!</span> Dónde se rompe tu versión</h2>
      <dl className="learn-failure"><dt>Entrada</dt><dd><code>{failure.input}</code></dd><dt>{challenge.kind === "two-sum" ? "Salida válida" : "Esperado"}</dt><dd><code>{failure.expected}</code></dd><dt>Tu resultado</dt><dd><code className="test-fail">{failure.actual}</code></dd></dl>
      {failure.reason && <p>{failure.reason}</p>}
      {failure.culprit && <p><b>La culpable es {failure.culprit.step}: «{failure.culprit.option}».</b> {failure.culprit.why}</p>}
      {failure.trace && <p className="learn-trace"><small>{failure.trace.sameCase ? "Paso a paso" : `El mismo error, en ${failure.trace.input}`}</small>{failure.trace.text}</p>}
    </article>}

    <article className="learn-block">
      <div className="learn-code-head"><h2><span>4</span> Así se ve la óptima</h2><select className="language-selector" aria-label="Lenguaje del código" value={language} onChange={event => { if (isPreviewLanguage(event.target.value)) onLanguage(event.target.value); }}>{previewLanguages.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
      <p className="learn-note">{built && different.length > 0 ? "Las líneas marcadas son las que no están en tu versión." : built ? "Es exactamente tu código." : "La versión completa, con las tres decisiones óptimas."} {optimalCost.time} de tiempo · {optimalCost.space} de espacio. {content.notation}</p>
      <div className="learn-code"><CodeBlock source={optimalSource} highlighted={built ? different : []} label="Solución óptima"/></div>
    </article>

    <article className="learn-block">
      <h2><span>5</span> Trade-offs reales</h2>
      <ul className="learn-list">{content.tradeOffs.map(item => <li key={item.title}><strong>{item.title}</strong><p>{item.detail}</p></li>)}</ul>
    </article>

    <article className="learn-block">
      <h2><span>6</span> Para llevarte</h2>
      <details className="learn-interview"><summary>Pregunta de entrevista: {content.interview.question}</summary><p>{content.interview.answer}</p></details>
      <div className="explain-links"><span>Para practicar</span>{content.related.map(item => <a key={item.url} href={item.url} target="_blank" rel="noreferrer">{item.title} ↗</a>)}<a href={challenge.resource.url} target="_blank" rel="noreferrer">{challenge.resource.title} ↗</a></div>
    </article>

    <div className="learn-actions"><button className="secondary" onClick={onBack}><ArrowLeft size={15}/> Volver al juego</button><button className="primary" onClick={onPractice}>Seguir practicando <ArrowRight size={15}/></button></div>
  </section>;
}
