"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock3, Code2, Copy, Flag, Flame, Lightbulb, Loader2, Play, RotateCcw, Send, Trophy, Users, X } from "lucide-react";
import { challenges, type Challenge, type Choices, isChoices, activeSteps } from "@/lib/challenges";
import { isPreviewLanguage, previewInLanguage, previewLanguages, type PreviewLanguage } from "@/lib/language-preview";
import { Execution } from "./execution";
import { CodeBlock, CodePeek, useChangedLines } from "./code";
import { ResultCard } from "./result-card";
import { Learn } from "./learn";
import { practiceUnlocked } from "@/lib/practice";
import { LeaderboardCard } from "@/components/ui/leaderboard-card";
import { Account } from "./account";
import { shareMessage } from "@/lib/share";
import type { Evaluation, Frame, Output } from "@/lib/engine";

type Daily = Challenge & { day: string; number: number };
type Group = { code: string; name: string };
type Leader = { name: string; score: number; elapsed: number; me: boolean };
type Attempt = { started_at: string; choices: Choices | null; result: Evaluation | null; elapsed: number | null };
type Session = { name: string; authenticated: boolean; canTest: boolean; day: string; serverNow: number; attempt: Attempt | null; testAttempt: (Attempt & {run_id:string}) | null; groups: Group[]; leaders: Leader[]; weeklyLeaders: Leader[]; week: {start:string; end:string}; streak?: Streak | null; rank?: { daily: Rank | null; weekly: Rank | null } };
type Streak = { current: number; best: number; lastPlayedDay: string | null; playedToday: boolean };
type Rank = { rank: number; total: number };
type Modal = "ranking" | "groups" | "help" | "result" | null;
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

async function api<T>(body?: Record<string, unknown>, group?: string, endpoint: "game" | "test-game" = "game"): Promise<Result<T>> {
  try {
    const response = await fetch(`/api/${endpoint}${group ? `?group=${encodeURIComponent(group)}` : ""}`, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
    const data = await response.json();
    return response.ok ? { ok: true, value: data as T } : { ok: false, error: typeof data.error === "string" ? data.error : "No pudimos conectar. Volvé a intentar." };
  } catch { return { ok: false, error: "No pudimos conectar. Revisá tu conexión y volvé a intentar." }; }
}

// Attempts stored before per-case results existed only carry a score.
function stored(result: Partial<Evaluation> & { score: number }): Evaluation {
  return { passed: 0, total: 0, efficient: false, feedback: [], ...result, tests: result.tests ?? [] };
}

const time = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2,"0")}:${(seconds % 60).toString().padStart(2,"0")}`;

export function Game({ challenge: daily }: { challenge: Daily }) {
  const [challenge, setChallenge] = useState<Challenge>(daily);
  const [language, setLanguage] = useState<PreviewLanguage>("typescript");
  const [session, setSession] = useState<Session | null>(null);
  const practiceKinds = challenges.filter(c => practiceUnlocked(c.kind, daily.day, Boolean(session?.attempt?.result)));
  const [loading, setLoading] = useState(true);
  const [restored, setRestored] = useState(false);
  const [practice, setPractice] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [choices, setChoices] = useState<Choices>([-1,-1,-1]);
  const [step, setStep] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [seconds, setSeconds] = useState(300);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [output, setOutput] = useState<Output | null>(null);
  const [showExecution, setShowExecution] = useState(false);
  const [learning, setLearning] = useState(false);
  const [chosenByHand, setChosenByHand] = useState(false);
  const [groupFilter, setGroupFilter] = useState("");
  const [rankingPeriod, setRankingPeriod] = useState<"daily" | "weekly">("daily");
  const [invite, setInvite] = useState("");
  const [groupName, setGroupName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const submitting = useRef(false);
  const dialog = useRef<HTMLElement>(null);
  const decision = useRef<HTMLDivElement>(null);
  const solutionPanel = useRef<HTMLElement>(null);
  const complete = isChoices(choices);
  const activeAttempt = testMode ? session?.testAttempt : session?.attempt;
  const locked = !practice && Boolean(activeAttempt?.result);
  const playing = practice || startedAt !== null;
  const currentStep = challenge.steps[step];
  const optionShift = (Number(daily.day.replaceAll("-", "")) + challenge.kind.length + step * 3) % 4;
  const orderedOptions = currentStep.options.map((_, i) => { const index = (i + optionShift) % 4; return { item: currentStep.options[index], index }; });
  const relevant = activeSteps(challenge.kind, choices[0]);
  const visibleSteps = choices[0] < 0 ? [0] : relevant;
  const stepPosition = relevant.indexOf(step);

  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    const root = dialog.current;
    root?.querySelector<HTMLButtonElement>("button")?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null);
      if (event.key !== "Tab" || !root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select, summary, [tabindex="0"]'));
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handle);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener("keydown", handle); if (previous instanceof HTMLElement) previous.focus(); };
  }, [modal]);

  const refresh = useCallback(async (group?: string) => {
    const result = await api<Session>(undefined, group);
    if (!result.ok) { setError(result.error); setLoading(false); return; }
    setSession(result.value);
    setOffset(result.value.serverNow - Date.now());
    setLoading(false);
    return result.value;
  }, []);

  useEffect(() => {
    let live = true;
    setSiteUrl(window.location.origin);
    void (async () => {
      let saved: Choices | null = null;
      const requestedTestMode = new URLSearchParams(window.location.search).get("mode") === "test";
      try {
        const value: unknown = JSON.parse(localStorage.getItem(`dailyleet:${requestedTestMode ? "test:" : ""}${daily.day}`) ?? "null");
        if (Array.isArray(value) && value.length === 3 && value.every(n => Number.isInteger(n) && n >= -1 && n < 4)) saved = value as Choices;
      } catch { /* Storage may be unavailable in private browsing. */ }
      const value = await refresh();
      if (!live || !value) return;
      setDisplayName(value.name);
      const useTestMode = Boolean(requestedTestMode && value.canTest && value.testAttempt);
      setTestMode(useTestMode);
      const attempt = useTestMode ? value.testAttempt : value.attempt;
      if (attempt) {
        setStartedAt(new Date(attempt.started_at).getTime());
        if (isChoices(attempt.choices)) setChoices(attempt.choices);
        if (attempt.result) { setEvaluation(stored(attempt.result)); }
      }
      if (!attempt?.result && saved && requestedTestMode === useTestMode) setChoices(saved);
      setRestored(true);
      const invitation = new URLSearchParams(window.location.search).get("group");
      if (invitation) { setInvite(invitation); setModal("groups"); }
    })();
    return () => { live = false; };
  }, [daily.day, refresh]);

  useEffect(() => {
    if (practice || loading || !session || !restored) return;
    try { localStorage.setItem(`dailyleet:${testMode ? "test:" : ""}${daily.day}`, JSON.stringify(choices)); } catch { /* The server still retains the scored attempt. */ }
  }, [choices, daily.day, practice, loading, session, restored, testMode]);

  useEffect(() => {
    if (startedAt === null || locked || practice) return;
    const tick = () => setSeconds(Math.max(0, 300 - Math.floor((Date.now() + offset - startedAt) / 1000)));
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [startedAt, locked, practice, offset]);

  const submit = useCallback(async (expired = false) => {
    if (submitting.current || practice || locked) return;
    submitting.current = true;
    setBusy(true); setError("");
    const response = await api<{ result: Evaluation; elapsed: number }>({ action: "submit", day: daily.day, choices: expired ? null : choices, ...(testMode ? {runId:session?.testAttempt?.run_id} : {}) }, undefined, testMode ? "test-game" : "game");
    if (response.ok) {
      setEvaluation(stored(response.value.result)); setShowExecution(true);
      await refresh();
      setModal("result");
    } else setError(response.error);
    setBusy(false); submitting.current = false;
  }, [practice, locked, daily.day, choices, refresh, testMode, session?.testAttempt?.run_id]);

  useEffect(() => {
    if (seconds === 0 && startedAt && !locked && !practice && !submitting.current) void submit(true);
  }, [seconds, startedAt, locked, practice, submit]);

  async function start() {
    setBusy(true); setError("");
    const response = await api<{ started_at: string; serverNow: number }>({ action: "start", day: daily.day });
    if (response.ok) {
      setStartedAt(new Date(response.value.started_at).getTime()); setOffset(response.value.serverNow - Date.now());
      requestAnimationFrame(() => decision.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    else setError(response.error);
    setBusy(false);
  }

  async function restartTest() {
    if (!session?.canTest || busy) return;
    setBusy(true); setError("");
    const response = await api<{run_id:string;started_at:string;serverNow:number}>({action:"start",day:daily.day},undefined,"test-game");
    if(response.ok) {
      const attempt = {...response.value,choices:null,result:null,elapsed:null};
      setSession(previous => previous ? {...previous,testAttempt:attempt} : previous);
      setTestMode(true); setPractice(false); setChallenge(daily); setChoices([-1,-1,-1]);
      setSeconds(300); setStartedAt(new Date(attempt.started_at).getTime()); setOffset(response.value.serverNow-Date.now());
      setEvaluation(null); setShowExecution(false); setLearning(false); setFrames([]); setOutput(null); setStep(0); setNotice(""); setModal(null);
      const url = new URL(window.location.href); url.searchParams.set("mode","test"); window.history.replaceState({},"",url);
    } else setError(response.error);
    setBusy(false);
  }

  function choose(index: number) {
    if (!playing || locked || busy) return;
    setChoices(previous => {
      const next: Choices = step === 0 ? [index,-1,-1] : [...previous];
      next[step] = index;
      const used = activeSteps(challenge.kind, next[0]);
      for (const position of [1,2]) if (!used.includes(position)) next[position] = 0;
      return next;
    });
    setFrames([]); setOutput(null); setShowExecution(false); setChosenByHand(true);
    if (practice) setEvaluation(null);
  }

  function openPractice(requested = daily.kind) {
    const kind = practiceUnlocked(requested, daily.day, Boolean(session?.attempt?.result)) ? requested : practiceKinds[0]?.kind ?? requested;
    setTestMode(false);
    const url = new URL(window.location.href); url.searchParams.delete("mode"); window.history.replaceState({},"",url);
    setPractice(true); setChallenge(challenges.find(c => c.kind === kind) ?? daily); setChoices([-1,-1,-1]);
    setStep(0); setFrames([]); setOutput(null); setEvaluation(null); setModal(null); setShowExecution(false); setLearning(false); setError("");
  }

  function openDaily() {
    setTestMode(false);
    setStartedAt(session?.attempt ? new Date(session.attempt.started_at).getTime() : null);
    setSeconds(300);
    const url = new URL(window.location.href); url.searchParams.delete("mode"); window.history.replaceState({},"",url);
    let saved: Choices = [-1,-1,-1];
    try { const value: unknown = JSON.parse(localStorage.getItem(`dailyleet:${daily.day}`) ?? "null"); if (Array.isArray(value) && value.length === 3 && value.every(n => Number.isInteger(n) && n >= -1 && n <= 3)) saved = value as Choices; } catch { /* Practice remains available without browser storage. */ }
    setPractice(false); setChallenge(daily); setChoices(session?.attempt?.choices ?? saved);
    setEvaluation(session?.attempt?.result ? stored(session.attempt.result) : null);
    setStep(0); setFrames([]); setOutput(null); setModal(null); setShowExecution(false); setLearning(false); setError("");
  }

  async function simulate(evaluateSolution = false) {
    if (!complete) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: challenge.kind, choices, practice: practice && evaluateSolution }) });
      if (!response.ok) { setError("No pudimos ejecutar el ejemplo. Volvé a intentar."); return; }
      const data = await response.json() as { frames: Frame[]; output: Output; result?: Evaluation };
      setFrames(data.frames); setFrameIndex(0); setOutput(data.output);
      if (practice && data.result) { setEvaluation(stored(data.result)); setShowExecution(true); setModal("result"); }
    } catch { setError("No pudimos ejecutar el ejemplo. Revisá tu conexión."); }
    finally { setBusy(false); }
  }

  async function mutate(body: Record<string, unknown>) {
    setBusy(true); setError("");
    const response = await api<{ code?: string }>(body);
    if (!response.ok) setError(response.error);
    else { await refresh(groupFilter); setNotice(body.action === "name" ? "Nombre guardado." : body.action === "create-group" ? "Grupo creado. Copiá el enlace para invitar." : "Ya sos parte del grupo."); }
    setBusy(false);
    return response;
  }

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setNotice("Copiado al portapapeles."); return true; }
    catch { setError("No pudimos copiar. Podés seleccionar el texto y copiarlo manualmente."); return false; }
  }

  async function share(): Promise<"shared" | "copied" | "failed"> {
    if (typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches) {
      try { await navigator.share({ text: shareText }); return "shared"; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return "failed"; }
    }
    return await copy(shareText) ? "copied" : "failed";
  }

  function openLearn() {
    setModal(null); setLearning(true);
  }

  const frame = frames[frameIndex];
  const ownRank = rankingPeriod === "weekly" ? session?.rank?.weekly : session?.rank?.daily;
  const streak = session?.streak?.current ?? 0;
  const sample: (string | number)[] = frame?.cells ?? [...challenge.sample.input];
  const source = previewInLanguage(challenge.kind, choices, language);
  const changed = useChangedLines(source, `${challenge.kind}:${language}`);
  const selectedLeaders = rankingPeriod === "weekly" ? session?.weeklyLeaders ?? [] : session?.leaders ?? [];
  const rankings = selectedLeaders.map((leader, index) => ({ userId: String(index), userName: leader.name, rank: index + 1, value: leader.score, elapsed: leader.elapsed }));
  const currentUserId = selectedLeaders.findIndex(leader => leader.me);
  const shareText = shareMessage({ score: evaluation?.score ?? 0, day: daily.day, title: challenge.title, url: siteUrl, practice, testing:testMode, cases: evaluation?.tests.map(test => test.passed) ?? [] });

  return <div className="app-shell">
    <header className="topbar"><button className="brand" onClick={openDaily} aria-label="DailyLeet inicio"><span className="brand-symbol"><Code2 size={23}/></span>daily<span className="brand-leet">leet</span><span className="beta">beta</span></button>
      <nav aria-label="Navegación principal"><button className={!practice ? "nav-active" : ""} onClick={openDaily}>Desafío diario</button><button className={practice ? "nav-active" : ""} onClick={() => openPractice()}>Practicar</button><button onClick={() => { setModal("ranking"); void refresh(groupFilter); }}><Trophy size={16}/> Ranking</button><button onClick={() => setModal("groups")}><Users size={16}/> Mis grupos</button><button onClick={() => setModal("help")}><Lightbulb size={16}/> Cómo se juega</button></nav>
      <div className="header-account">{streak > 0 && <span className="streak-chip" title={`Racha: ${streak} ${streak === 1 ? "día" : "días"} seguidos · mejor: ${session?.streak?.best ?? streak}`} aria-label={`Racha de ${streak} ${streak === 1 ? "día" : "días"}`}><Flame size={15}/> {streak}</span>}<Account name={session?.name ?? ""} guestLabel={session?.name.slice(0,2).toUpperCase() ?? "··"} onEdit={() => setModal("groups")}/></div>
    </header>

    <main>
      {session?.canTest && !testMode && <div className="intro-tools"><button className="secondary" disabled={busy} onClick={() => void restartTest()}>Modo de pruebas</button></div>}
      {testMode && <div className="test-mode-banner"><div><strong>Modo de pruebas privado</strong><span>Repetí el desafío todas las veces que quieras. Estos resultados no van al ranking.</span></div><button className="secondary" disabled={busy} onClick={() => void restartTest()}><RotateCcw size={14}/> Reiniciar prueba</button><button className="text-button" onClick={openDaily}>Volver al daily</button></div>}

      {error && <div className="alert error" role="alert">{error}<button onClick={() => setError("")} aria-label="Cerrar error"><X size={16}/></button></div>}
      {notice && <div className="alert notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Cerrar aviso"><X size={16}/></button></div>}
      {practice && <div className="practice-switch"><span>Elegí un reto</span>{practiceKinds.map(c => <button key={c.kind} className={challenge.kind === c.kind ? "selected" : ""} onClick={() => openPractice(c.kind)}>{c.title}</button>)}<span className="practice-note">Sin timer ni ranking</span></div>}

      {learning && evaluation ? <Learn challenge={challenge} choices={choices} result={evaluation} language={language} onLanguage={setLanguage} onBack={() => setLearning(false)} onPractice={() => openPractice(challenge.kind)}/> : <><div className="workspace"><section className="problem-panel">
        <div className="panel-heading"><span><span className="small-square"><Flag size={14}/></span> El problema de hoy</span><span className="pill topic">{challenge.topic}</span></div>
        <div className="problem-content"><div className="problem-title"><h2>{challenge.title}</h2><span className={`pill ${challenge.difficulty === "Fácil" ? "easy" : "medium"}`}>{challenge.difficulty}</span></div><p className="description">{challenge.description}</p>
          <div className="example"><div className="example-label">Un ejemplo</div><div className="example-line"><span>Entrada</span><code>{challenge.example}</code></div><div className="example-line"><span>Salida</span><code className="expected">{challenge.expected}</code></div><p>{challenge.explanation}</p></div>
          <details className="constraints"><summary>Restricciones <ChevronDown size={15}/></summary><ul>{challenge.constraints.map(c => <li key={c}>{c}</li>)}</ul></details>
          <div className="divider"/>
          <div className="progress-heading"><span>Progreso</span><span>{choices[0] < 0 ? "Elegí un enfoque" : `${relevant.filter(i => choices[i] >= 0).length} de ${relevant.length}`}</span></div>
          <div className="stepper progress-steps" role="group" aria-label="Progreso de la solución">{visibleSteps.map((i, position) => <button key={i} type="button" aria-label={`Decisión ${position + 1}: ${challenge.steps[i].title}${choices[i] >= 0 ? ", completada" : ""}`} aria-current={i === step ? "step" : undefined} className={choices[i] >= 0 ? "done" : ""} disabled={(i > 0 && choices[0] < 0) || (i === 2 && relevant.includes(1) && choices[1] < 0)} onClick={() => setStep(i)}/>)}</div>
          <div className="decision" ref={decision}><div className="question-label">Decisión {stepPosition+1}</div><h4>{currentStep.question}</h4><div className="options">{orderedOptions.map(({ item, index }, position) => <button data-choice={index} key={item.title} disabled={!playing || locked || busy} aria-pressed={choices[step] === index} className={`option ${choices[step] === index ? "chosen" : ""}`} onClick={() => choose(index)}><span className="option-key">{String.fromCharCode(65+position)}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><span className="option-radio">{choices[step] === index && <Check size={12}/>}</span></button>)}</div>{playing && !locked && <CodePeek source={source} changed={changed} follow={chosenByHand} onExpand={() => solutionPanel.current?.scrollIntoView({ behavior: "smooth", block: "start" })}/>}</div>
          <div className="step-navigation"><button className="text-button" disabled={stepPosition <= 0} onClick={() => setStep(relevant[stepPosition-1])}><ArrowLeft size={15}/> Anterior</button>{locked ? <button className="text-button" onClick={() => openPractice(challenge.kind)}>Seguir practicando <ArrowRight size={15}/></button> : stepPosition === relevant.length-1 ? <button className="text-button" disabled={!complete || !playing || busy} onClick={() => practice ? void simulate(true) : void submit()}>{practice ? "Ejecutar y evaluar" : "Enviar y terminar"} <ArrowRight size={15}/></button> : <button className="text-button" disabled={choices[step] < 0} onClick={() => setStep(relevant[stepPosition+1])}>Siguiente <ArrowRight size={15}/></button>}</div>
        </div>
      </section>

      <section className="solution-panel" ref={solutionPanel}><div className="panel-heading"><span><Code2 size={17}/> Tu código, en vivo</span><select className="language-selector" aria-label="Lenguaje de programación" value={language} onChange={event => { if (isPreviewLanguage(event.target.value)) setLanguage(event.target.value); }}>{previewLanguages.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
        <div className="code-area"><div className="file-label"><span className="ts-icon">{previewLanguages.find(item => item.id === language)?.badge}</span> {previewLanguages.find(item => item.id === language)?.file} <span>{complete ? `${relevant.length} ${relevant.length === 1 ? "decisión aplicada" : "decisiones aplicadas"}` : "Las piezas pendientes están marcadas"}</span></div><CodeBlock source={source} highlighted={changed} label="Código generado" scrollToHighlight/></div>
        {showExecution && evaluation ? <Execution key={JSON.stringify(choices)} result={evaluation} challenge={challenge} onResult={() => setModal("result")} onLearn={openLearn}/> : frames.length > 0 ? <div className="trace-area compact-trace"><div className="trace-heading"><span>Ejemplo · resultado: <code>{JSON.stringify(output)}</code></span><span>Paso {frameIndex+1} / {frames.length}</span></div><div className="cells">{sample.map((value,index) => <div className={`cell ${frame && index === frame.index ? "cursor" : ""} ${frame && index >= frame.left && index <= frame.index ? "in-window" : ""}`} key={index}><span>{value}</span><small>{index}</small></div>)}</div><div className="trace-observation"><span>Memoria <code>{JSON.stringify(frame?.memory ?? [])}</code></span><span>Valor <code>{frame?.value ?? 0}</code></span></div><div className="trace-controls"><button className="secondary" disabled={frameIndex === 0} onClick={() => setFrameIndex(i => i-1)}><ArrowLeft size={15}/> Atrás</button><input aria-label="Paso de ejecución" type="range" min={0} max={frames.length-1} value={frameIndex} onChange={event => setFrameIndex(Number(event.target.value))}/><button className="secondary" disabled={frameIndex === frames.length-1} onClick={() => setFrameIndex(i => i+1)}>Avanzar <ArrowRight size={15}/></button></div></div> : null}
        <div className="solution-bottom"><div className="run-actions"><span className="submission-note" role="status">{busy ? "Ejecutando tu solución…" : "Primero los tests. Después, tu puntaje."}</span><button className="secondary run-button" disabled={!complete || !playing || busy || locked} onClick={() => void simulate()}><Play size={16}/> Probar ejemplo</button><button className="primary" disabled={!complete || !playing || busy || locked} onClick={() => practice ? void simulate(true) : void submit()}>{busy ? <Loader2 size={16} className="spin"/> : <Send size={16}/>} {busy ? "Ejecutando…" : "Enviar solución"}</button></div></div>
      </section></div>

      <section className="game-bar"><div className="timer"><span className={`timer-icon ${seconds < 60 && playing && !practice && !locked ? "urgent" : ""}`}><Clock3 size={20}/></span><div><strong>{practice ? "Sin límite" : locked ? "Partida terminada" : time(seconds)}</strong><span>{practice ? "Equivocate todas las veces que quieras" : testMode && locked ? "Podés reiniciar esta prueba cuantas veces quieras" : locked ? "Seguí explorando en práctica sin cambiar tu puntaje" : playing ? "El timer sigue aunque cierres la página" : "El tiempo empieza cuando vos decidas"}</span></div></div><div className="game-bar-right">{locked ? <><span className="saved-label"><Check size={15}/> Resultado guardado</span><button className="primary" onClick={() => { setShowExecution(true); setModal("result"); }}>Ver resultado <Trophy size={16}/></button></> : practice ? <><button className="text-button" onClick={() => openPractice(challenge.kind)}><RotateCcw size={15}/> Reiniciar</button>{evaluation && <button className="primary" onClick={() => { setShowExecution(true); setModal("result"); }}>Ver evaluación</button>}</> : !playing ? <><span className="bar-note">Una partida puntuable por día</span><button className="primary start-button" disabled={busy || loading || !session} onClick={() => void start()}>{busy || loading ? <Loader2 size={17} className="spin"/> : <Play size={17}/>} Empezar desafío</button></> : <span className="playing-label"><span className="live-dot"/> Desafío en curso</span>}</div></section></>}
      <footer><span>Un poquito de lógica, todos los días.</span><span>Nuevo desafío a las 00:00 UTC <span className="footer-dot">·</span> Hecho para mentes curiosas</span></footer>
    </main>

    {modal && <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget) setModal(null); }}><section ref={dialog} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="close-modal" onClick={() => setModal(null)} aria-label="Cerrar"><X size={20}/></button>
      {error && <div className="alert error" role="alert">{error}</div>}{notice && <div className="alert notice" role="status">{notice}</div>}
      {modal === "result" && evaluation && <ResultCard result={evaluation} title={challenge.title} mode={practice ? "practice" : testMode ? "test" : "daily"} elapsed={!practice && !testMode ? activeAttempt?.elapsed ?? null : null} rank={!practice && !testMode ? session?.rank?.daily ?? null : null} streak={streak} onShare={share} onLearn={openLearn} onCases={() => { setModal(null); setShowExecution(true); requestAnimationFrame(() => solutionPanel.current?.querySelector(".execution-results")?.scrollIntoView({ behavior: "smooth", block: "start" })); }}/>}
      {modal === "help" && <><span className="modal-icon"><Lightbulb/></span><h2 id="modal-title">Tu lógica, en tres decisiones.</h2><p>Leé el problema antes de empezar. Cuando estés listo, arrancá el timer de cinco minutos.</p><ol className="help-list"><li><strong>Elegí un enfoque.</strong> Decidí cómo recorrer los datos.</li><li><strong>Armá la memoria.</strong> Elegí qué información conservar.</li><li><strong>Definí la regla.</strong> Construí el comportamiento de tu algoritmo.</li></ol><p>Podés cambiar decisiones y ejecutar el ejemplo. El envío es definitivo y corre contra doce tests: 90 puntos por corrección, hasta 7 por eficiencia y hasta 3 por tiempo. Las soluciones parciales también suman en cada categoría.</p><p className="muted">Lunes a domingo la dificultad sube: el lunes calienta, el domingo es brutal. Tu racha cuenta los días seguidos que jugás (UTC). Podés jugar sin cuenta, pero solo las partidas con sesión iniciada entran al ranking mundial.</p><button className="primary full" onClick={() => setModal(null)}>Entendido</button></>}
      {modal === "ranking" && <><span className="modal-icon"><Trophy/></span><h2 id="modal-title">Ranking</h2>{session?.authenticated ? <><label className="field-label" htmlFor="ranking-filter">Comparate con</label><select id="ranking-filter" value={groupFilter} onChange={event => { setGroupFilter(event.target.value); void refresh(event.target.value); }}><option value="">Todo el mundo</option>{session?.groups.map(g => <option key={g.code} value={g.code}>{g.name}</option>)}</select>{session && <LeaderboardCard fromDate={rankingPeriod === "weekly" ? session.week.start : daily.day} toDate={rankingPeriod === "weekly" ? session.week.end : daily.day} rankings={rankings} podiumRankings={rankings.slice(0,3)} currentUserId={currentUserId < 0 ? undefined : String(currentUserId)} selectedRunId={rankingPeriod} runOptions={[{id:"daily",label:"Diario"},{id:"weekly",label:"Semanal"}]} onRunChange={value => setRankingPeriod(value === "weekly" ? "weekly" : "daily")}/>}{ownRank && <p className="own-rank">Estás <strong>#{ownRank.rank.toLocaleString("es-AR")}</strong> de {ownRank.total.toLocaleString("es-AR")} {rankingPeriod === "weekly" ? "esta semana" : "hoy"} en el mundo.</p>}<p className="muted">{rankingPeriod === "weekly" ? "La semana va de lunes a domingo (UTC). Se suman los puntos y el tiempo de tus desafíos diarios." : "Primeros 50 del día. Se ordena por puntaje y luego por tiempo."}</p></> : <><p>El ranking mundial es solo para cuentas. Iniciá sesión para entrar y ver el diario y el semanal.</p><a className="primary ranking-sign-in" href="/sign-in">Iniciar sesión</a></>}</>}
      {modal === "groups" && <><span className="modal-icon"><Users/></span><h2 id="modal-title">Mejor con tu gente.</h2><p>Creá un grupo y compartí el enlace para competir con amigos.</p><form onSubmit={event => { event.preventDefault(); void mutate({ action: "name", name: displayName }); }}><label className="field-label" htmlFor="display-name">Tu nombre en el ranking</label><div className="input-row"><input id="display-name" maxLength={24} value={displayName} onChange={event => setDisplayName(event.target.value)} required/><button className="secondary" disabled={busy}>Guardar</button></div></form><form onSubmit={event => { event.preventDefault(); void mutate({ action: "create-group", name: groupName }).then(r => { if (r.ok) setGroupName(""); }); }}><label className="field-label" htmlFor="group-name">Un nuevo grupo</label><div className="input-row"><input id="group-name" placeholder="Los del deploy del viernes" maxLength={40} value={groupName} onChange={event => setGroupName(event.target.value)} required/><button className="primary" disabled={busy}>Crear</button></div></form>{invite && <div className="invitation"><strong>Tenés una invitación</strong><p>Unite para aparecer en el ranking del grupo.</p><button className="primary" disabled={busy} onClick={() => void mutate({ action: "join-group", code: invite }).then(r => { if (r.ok) { setInvite(""); window.history.replaceState({},"",window.location.pathname); } })}>Unirme al grupo</button></div>}<div className="groups-list">{session?.groups.map(g => <div className="group-row" key={g.code}><span className="group-avatar"><Users size={18}/></span><strong>{g.name}</strong><button className="icon-button" aria-label={`Copiar invitación de ${g.name}`} onClick={() => void copy(`${window.location.origin}/?group=${g.code}`)}><Copy size={17}/></button><button className="icon-button" aria-label={`Ver ranking de ${g.name}`} onClick={() => { setGroupFilter(g.code); void refresh(g.code); setModal("ranking"); }}><ArrowRight size={17}/></button></div>)}</div><p className="muted">Cualquiera con el enlace puede unirse. Iniciá sesión para conservar tus grupos y puntajes entre dispositivos.</p></>}
    </section></div>}
  </div>;
}
