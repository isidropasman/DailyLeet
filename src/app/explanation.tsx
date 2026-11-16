import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { Challenge, Choices } from "@/lib/challenges";
import { activeSteps } from "@/lib/challenges";
import type { Evaluation } from "@/lib/engine";
import { explainResult, explanations, formatCase } from "@/lib/explanations";
import type { Verdict } from "@/lib/explanation-types";

const tone: Record<Verdict | "válida con tu enfoque", string> = {
  "óptima": "good",
  "correcta pero más lenta": "slow",
  "incorrecta": "bad",
  "válida con tu enfoque": "slow",
};

function Section({ title, teaser, open = false, children }: { title: string; teaser?: string; open?: boolean; children: ReactNode }) {
  return <details className="explain-section" open={open}>
    <summary><span><strong>{title}</strong>{teaser && <small>{teaser}</small>}</span><ChevronDown size={15}/></summary>
    <div className="explain-body">{children}</div>
  </details>;
}

export function Explanation({ challenge, choices, result, fallback }: { challenge: Challenge; choices: Choices; result: Evaluation; fallback: ReactNode }) {
  const solution = explainResult(challenge.kind, choices, result);
  if (!solution) return fallback;
  const content = explanations[challenge.kind];
  const used = activeSteps(challenge.kind, choices[0]);
  const { failure } = solution;

  return <div className="explain" aria-label="Explicación de la solución">
    <div className={`explain-verdict ${tone[solution.status]}`}><span className="explain-pill">{solution.status === "óptima" ? "Solución óptima" : solution.status === "incorrecta" ? "Solución incorrecta" : "Correcta, pero no óptima"}</span><p>{solution.headline}</p></div>

    <div className="explain-key"><span>La idea clave</span><p>{content.keyIdea.summary}</p><details><summary>Por qué funciona</summary><p>{content.keyIdea.detail}</p></details></div>

    <Section title="Tu solución" teaser={`${solution.cost.time} de tiempo · ${solution.cost.space} de espacio`} open>
      <ol className="explain-choices">{solution.choices.filter(item => item.active).map(item => <li key={item.step}>
        <div><small>{item.title}</small><strong>{item.option}</strong>{item.verdict && <span className={`explain-tag ${tone[item.verdict]}`}>{item.verdict}</span>}</div>
        {item.why && <p>{item.why}</p>}
      </li>)}</ol>
      {solution.skipped && <p className="explain-note">{solution.skipped}</p>}
      {failure && <div className="explain-failure">
        <strong>El caso más chico que falla · {failure.label}</strong>
        <dl><dt>Entrada</dt><dd><code>{failure.input}</code></dd><dt>{challenge.kind === "two-sum" ? "Salida válida" : "Esperado"}</dt><dd><code>{failure.expected}</code></dd><dt>Tu resultado</dt><dd><code className="test-fail">{failure.actual}</code></dd></dl>
        {failure.reason && <p>{failure.reason}</p>}
        {failure.culprit && <p><b>Lo rompe {failure.culprit.step}: «{failure.culprit.option}».</b> {failure.culprit.why}</p>}
        {failure.trace && <div className="explain-trace"><small>{failure.trace.sameCase ? "Traza" : `El mismo error, en ${failure.trace.input}`}</small><p>{failure.trace.text}</p></div>}
      </div>}
      <p className="explain-note">{content.notation}</p>
    </Section>

    <Section title="Por qué cada decisión" teaser="Qué gana la óptima y qué cuesta cada alternativa">
      <p className="explain-note">Cada veredicto compara con la solución óptima cambiando solo esa decisión.</p>
      {challenge.steps.map((step, stepIndex) => used.includes(stepIndex) ? <div className="explain-step" key={step.title}>
        <h5>{step.title} <small>{step.question}</small></h5>
        <ul>{step.options.map((option, optionIndex) => {
          const detail = content.steps[stepIndex][optionIndex];
          const alternative: Choices = [...content.optimal];
          alternative[stepIndex] = optionIndex;
          const cost = content.cost(alternative);
          return <li key={option.title} className={choices[stepIndex] === optionIndex ? "mine" : ""}>
            <div><strong>{option.title}</strong><span className={`explain-tag ${tone[detail.verdict]}`}>{detail.verdict}</span>{choices[stepIndex] === optionIndex && <span className="explain-tag mine">tu elección</span>}</div>
            <p>{detail.why} {detail.verdict === "incorrecta" ? <em>Se rompe con <code>{formatCase(challenge.kind, detail.counterexample)}</code>.</em> : <em>{cost.time} · {cost.space} de espacio.</em>}</p>
          </li>;
        })}</ul>
      </div> : <p className="explain-note" key={step.title}><b>{step.title}:</b> no aplica con tu enfoque.</p>)}
    </Section>

    <Section title="Trade-offs reales" teaser="Cuándo la opción «peor» es la correcta">
      <ul className="explain-list">{content.tradeOffs.map(item => <li key={item.title}><strong>{item.title}</strong><p>{item.detail}</p></li>)}</ul>
    </Section>

    <Section title="Cómo pensar este tipo de problemas" teaser={content.pattern.heuristic}>
      <p>{content.pattern.detail}</p>
      <div className="explain-links"><span>Para practicar</span>{content.related.map(item => <a key={item.url} href={item.url} target="_blank" rel="noreferrer">{item.title} ↗</a>)}<a href={challenge.resource.url} target="_blank" rel="noreferrer">{challenge.resource.title} ↗</a></div>
    </Section>

    <Section title="Pregunta de entrevista" teaser={content.interview.question}>
      <details className="explain-answer"><summary>Ver respuesta</summary><p>{content.interview.answer}</p></details>
    </Section>
  </div>;
}
