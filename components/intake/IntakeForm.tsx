"use client";

import { useCallback, useEffect, useState } from "react";
import { INTAKE_CSS } from "./theme";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Answers = Record<string, unknown>;

export interface Field {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url";
  /** Renders full-width in the two-column field grid. */
  wide?: boolean;
}

export interface Option {
  value: string;
  label: string;
  subtext?: string;
  badge?: string;
}

export type QuestionType =
  | "text_fields"
  | "textarea"
  | "single_select"
  | "multi_select";

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  subtext?: string;
  fields?: Field[];
  options?: Option[];
  placeholder?: string;
  required?: boolean;
  /** Skipped entirely when this returns false — not shown, not counted, not required. */
  showIf?: (a: Answers) => boolean;
}

export interface IntakeFormProps {
  /** Distinguishes stored progress between forms. */
  storageKey: string;
  eyebrow: string;
  questions: Question[];
  /** Receives the answers; throws to keep the user on the last step. */
  onSubmit: (answers: Answers) => Promise<void>;
  submitLabel?: string;
  done: { title: string; body: React.ReactNode };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const str = (a: Answers, k: string) => (typeof a[k] === "string" ? (a[k] as string) : "");
const arr = (a: Answers, k: string) => (Array.isArray(a[k]) ? (a[k] as string[]) : []);

/**
 * Whether a question has enough to move on.
 *
 * Required is checked here rather than at submit so the Continue button is the
 * thing that tells you — a form that accepts every step then rejects the whole
 * thing at the end is the fastest way to lose someone eight minutes in.
 */
function satisfied(q: Question, a: Answers): boolean {
  if (!q.required) return true;
  if (q.type === "text_fields") {
    return (q.fields ?? []).every((f) => !f.required || str(a, f.key).trim() !== "");
  }
  if (q.type === "multi_select") return arr(a, q.id).length > 0;
  return str(a, q.id).trim() !== "";
}

/**
 * Any half-finished answers from last time.
 *
 * Resuming matters here more than on most forms: the design intake runs eight
 * minutes, and a closed tab that loses everything is a person who does not come
 * back to start again.
 */
function readDraft(key: string): { answers: Answers; step: number } {
  if (typeof window === "undefined") return { answers: {}, step: 0 };
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return { answers: {}, step: 0 };
    const saved = JSON.parse(raw) as { answers?: Answers; step?: number };
    return {
      answers: saved.answers ?? {},
      step: typeof saved.step === "number" ? saved.step : 0,
    };
  } catch {
    // A corrupt draft is not worth blocking the form over.
    return { answers: {}, step: 0 };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function IntakeForm({
  storageKey, eyebrow, questions, onSubmit, submitLabel = "Submit", done,
}: IntakeFormProps) {
  const draft = useState(() => readDraft(storageKey))[0];
  const [answers, setAnswers] = useState<Answers>(draft.answers);
  const [step, setStep] = useState(draft.step);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [animKey, setAnimKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (document.getElementById("wfd-intake-css")) return;
    const el = document.createElement("style");
    el.id = "wfd-intake-css";
    el.textContent = INTAKE_CSS;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ answers, step })); } catch { /* private mode */ }
  }, [answers, step, storageKey]);

  // Only the questions that apply, so "step 3 of 6" counts what you will see.
  const visible = questions.filter((q) => !q.showIf || q.showIf(answers));
  const index = Math.min(step, Math.max(0, visible.length - 1));
  const q = visible[index];
  const canNext = q ? satisfied(q, answers) : false;
  const isLast = index === visible.length - 1;

  const set = useCallback((key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  function toggle(key: string, value: string) {
    setAnswers((prev) => {
      const cur = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];
      return { ...prev, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(answers);
      try { localStorage.removeItem(storageKey); } catch { /* private mode */ }
      setFinished(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  function next() {
    if (!canNext || submitting) return;
    if (isLast) { void submit(); return; }
    setDir("fwd"); setStep(index + 1); setAnimKey((k) => k + 1);
  }

  function back() {
    if (index === 0) return;
    setDir("back"); setStep(index - 1); setAnimKey((k) => k + 1);
  }

  // Enter advances, except inside a textarea where it means a new line.
  // Rebound every render on purpose: the handler closes over the current answers,
  // and a stale one would advance past a step the user had just filled in.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter" || finished) return;
      if ((e.target as HTMLElement | null)?.tagName === "TEXTAREA") return;
      if (!canNext) return;
      e.preventDefault();
      next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (finished) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="q-enter" style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>🔥</div>
          <p className="q-eyebrow">Wood Fired Designs</p>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 34, marginBottom: 16 }}>{done.title}</h2>
          <div style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.8 }}>{done.body}</div>
        </div>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ width: "100%", maxWidth: 620 }}>
        {/* Progress. Shown as a bar and a count — the bar for the feeling, the
            count because "3 of 6" is the number that decides whether to start. */}
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span className="q-eyebrow" style={{ marginBottom: 0 }}>{eyebrow}</span>
            <span style={{ fontSize: 11, color: "var(--text-dim)", fontVariantNumeric: "tabular-nums" }}>
              {index + 1} of {visible.length}
            </span>
          </div>
          <div className="q-bar" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={visible.length}>
            <span className="q-bar-fill" style={{ width: `${((index + 1) / visible.length) * 100}%` }} />
          </div>
        </div>

        <div key={animKey} className={dir === "fwd" ? "q-enter" : "q-enter-back"}>
          <h1 className="q-title">{q.question}</h1>
          {q.subtext && <p className="q-sub">{q.subtext}</p>}

          {q.type === "text_fields" && (
            <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {(q.fields ?? []).map((f) => (
                <div key={f.key} style={{ gridColumn: f.wide ? "1 / -1" : undefined }}>
                  <label htmlFor={f.key} style={{ display: "block", fontSize: 11, color: "var(--text-secondary)", marginBottom: 5 }}>
                    {f.label}{f.required && <span style={{ color: "var(--accent)" }}> *</span>}
                  </label>
                  <input
                    id={f.key}
                    className="field"
                    type={f.type ?? "text"}
                    placeholder={f.placeholder}
                    value={str(answers, f.key)}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {q.type === "textarea" && (
            <textarea
              className="field"
              aria-label={q.question}
              placeholder={q.placeholder}
              value={str(answers, q.id)}
              onChange={(e) => set(q.id, e.target.value)}
            />
          )}

          {(q.type === "single_select" || q.type === "multi_select") && (
            <div role={q.type === "single_select" ? "radiogroup" : "group"} aria-label={q.question}
                 style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(q.options ?? []).map((o) => {
                const selected = q.type === "single_select"
                  ? str(answers, q.id) === o.value
                  : arr(answers, q.id).includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    role={q.type === "single_select" ? "radio" : "checkbox"}
                    aria-checked={selected}
                    className={`opt-card${selected ? " sel" : ""}`}
                    onClick={() => {
                      if (q.type === "single_select") { set(q.id, o.value); }
                      else { toggle(q.id, o.value); }
                    }}
                  >
                    <span className={q.type === "single_select" ? "opt-radio" : "opt-check"} aria-hidden="true">
                      {q.type === "multi_select" && selected ? "✓" : ""}
                    </span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14.5, fontWeight: 500 }}>{o.label}</span>
                        {o.badge && (
                          <span style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 7px", borderRadius: 99 }}>
                            {o.badge}
                          </span>
                        )}
                      </span>
                      {o.subtext && (
                        <span style={{ display: "block", fontSize: 12.5, color: "var(--text-secondary)", marginTop: 3, lineHeight: 1.55 }}>
                          {o.subtext}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <p role="alert" style={{ marginTop: 16, fontSize: 13, color: "#FF6B6B" }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 28, alignItems: "center" }}>
            {index > 0 && (
              <button type="button" className="btn-ghost" onClick={back} disabled={submitting}>Back</button>
            )}
            <button type="button" className="btn" onClick={next} disabled={!canNext || submitting}>
              {submitting ? "Sending…" : isLast ? submitLabel : "Continue"}
            </button>
            {!q.required && !isLast && (
              <button
                type="button"
                onClick={() => { setDir("fwd"); setStep(index + 1); setAnimKey((k) => k + 1); }}
                style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-b)" }}
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
