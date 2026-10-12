import { useState, useEffect, useRef, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Users,
  BookOpen,
  BarChart3,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import api from "../lib/api";

const SUGGESTIONS = [
  { icon: Users, text: "Quels chercheurs sont associés à l’IA explicable ?" },
  { icon: BookOpen, text: "Trouve des publications sur les chutes de pierres" },
  { icon: BookOpen, text: "Résume les publications sur le machine learning" },
  {
    icon: BarChart3,
    text: "Combien de publications sont disponibles dans la base locale ?",
  },
];

function Answer({ result, prefix }) {
  const sources = result.sources || [];
  return (
    <div className="text-sm text-slate-200 space-y-3 leading-relaxed">
      {result.answer.split("\n").map((line, i) => (
        <p key={i}>
          {line.split(/(\*\*.*?\*\*|\[[A-Za-z0-9]+\])/g).map((part, j) => {
            if (part.startsWith("**") && part.endsWith("**"))
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            const index = sources.findIndex((s) => `[${s.id}]` === part);
            if (index >= 0)
              return (
                <a
                  key={j}
                  href={`#${prefix}-source-${index}`}
                  className="text-indigo-300 underline underline-offset-2"
                  aria-label={`Source ${index + 1}`}
                >
                  [{index + 1}]
                </a>
              );
            return <span key={j}>{part}</span>;
          })}
        </p>
      ))}
    </div>
  );
}

export default function OracleOmnibar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const requestRef = useRef(null);
  const prefix = useId();

  const close = useCallback(() => {
    requestRef.current?.abort();
    requestRef.current = null;
    setThinking(false);
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) close();
        else setOpen(true);
      }
      if (e.key === "Escape" && open) close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => () => requestRef.current?.abort(), []);

  const runQuery = useCallback(async (question) => {
    if (question.trim().length < 3) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setThinking(true);
    setResult(null);
    setError("");
    try {
      const response = await api.post(
        "/api/oracle",
        { question: question.trim() },
        { signal: controller.signal, timeout: 90000 },
      );
      if (requestRef.current === controller) setResult(response.data);
    } catch {
      if (!controller.signal.aborted && requestRef.current === controller) {
        setError(
          "La recherche n’a pas abouti. Vérifiez que l’API et MongoDB sont disponibles, puis réessayez.",
        );
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setThinking(false);
      }
    }
  }, []);

  useEffect(() => {
    const handler = (event) => {
      setOpen(true);
      const question = event.detail?.question || "";
      if (question) {
        setQuery(question);
        runQuery(question);
      }
    };
    window.addEventListener("listic:oracle", handler);
    return () => window.removeEventListener("listic:oracle", handler);
  }, [runQuery]);

  const trapFocus = (e) => {
    if (e.key !== "Tab") return;
    const elements = [
      ...dialogRef.current.querySelectorAll(
        "button:not(:disabled), input, a[href]",
      ),
    ];
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    }
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="oracle-trigger flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 dark:hover:text-white text-xs font-medium transition"
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>Oracle</span>
        <kbd className="hidden lg:inline px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
          Ctrl/⌘ K
        </kbd>
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="oracle-overlay fixed inset-0 z-[200] flex items-start justify-center pt-[6vh] px-4 bg-black/75 backdrop-blur-sm"
              onClick={(e) => e.target === e.currentTarget && close()}
            >
              <Motion.div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${prefix}-title`}
                onKeyDown={trapFocus}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="oracle-dialog w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl border border-white/10 bg-slate-950 text-white shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                  <div>
                    <h2
                      id={`${prefix}-title`}
                      className="flex items-center gap-2 font-semibold"
                    >
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      Oracle LISTIC
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Explorez les chercheurs et leurs travaux, avec les sources
                      utilisées.
                    </p>
                  </div>
                  <button
                    onClick={close}
                    aria-label="Fermer l’Oracle"
                    className="p-2 rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    runQuery(query);
                  }}
                  className="flex items-center gap-2 px-5 pb-4 border-b border-white/10"
                >
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    maxLength={1000}
                    aria-label="Votre question au sujet du LISTIC"
                    placeholder="Qui travaille sur l’IA explicable ?"
                    className="min-w-0 flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-sm outline-none focus:border-indigo-400 placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={query.trim().length < 3 || thinking}
                    className="flex items-center gap-2 px-3 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl text-sm font-medium"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Rechercher</span>
                  </button>
                </form>
                <div
                  className="overflow-y-auto px-5 py-4 space-y-4"
                  aria-busy={thinking}
                >
                  {thinking && (
                    <p
                      role="status"
                      className="flex gap-2 items-center text-sm text-indigo-300"
                    >
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      Recherche dans les données du laboratoire…
                    </p>
                  )}
                  {error && (
                    <p role="alert" className="text-sm text-red-300">
                      {error}
                    </p>
                  )}
                  {!thinking && !result && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">
                        Quelques questions pour commencer
                      </p>
                      {SUGGESTIONS.map((s) => {
                        const Icon = s.icon;
                        return (
                          <button
                            key={s.text}
                            onClick={() => {
                              setQuery(s.text);
                              runQuery(s.text);
                            }}
                            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-white/5 text-left text-sm text-slate-300"
                          >
                            <Icon className="w-4 h-4 shrink-0 text-indigo-400" />
                            {s.text}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {result && (
                    <>
                      <span className="inline-block text-xs px-2 py-1 bg-indigo-500/15 text-indigo-200 rounded-md">
                        {result.mode === "gemini"
                          ? "Synthèse Gemini · sources locales"
                          : "Recherche locale · sans synthèse IA"}
                      </span>
                      <Answer result={result} prefix={prefix} />
                      {result.warnings?.length > 0 && (
                        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 space-y-2">
                          {result.warnings.map((w) => (
                            <p
                              key={w}
                              className="flex gap-2 text-xs text-amber-200"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              {w}
                            </p>
                          ))}
                        </div>
                      )}
                      {result.sources?.length > 0 && (
                        <section
                          aria-label="Sources de la réponse"
                          className="space-y-2"
                        >
                          <h3 className="text-sm font-semibold">
                            Sources utilisées
                          </h3>
                          {result.sources.map((s, i) => (
                            <article
                              key={s.id}
                              id={`${prefix}-source-${i}`}
                              className="rounded-xl bg-slate-900 border border-white/10 p-3 scroll-mt-4"
                            >
                              <p className="text-xs text-slate-400 mb-1">
                                [{i + 1}] {s.origin}
                                {s.year ? ` · ${s.year}` : ""}
                              </p>
                              {s.url ? (
                                <a
                                  href={s.url}
                                  target={
                                    s.url.startsWith("/") ? undefined : "_blank"
                                  }
                                  rel="noopener noreferrer"
                                  className="text-sm text-indigo-200 hover:underline"
                                >
                                  {s.title}
                                  <ExternalLink className="inline w-3 h-3 ml-1" />
                                </a>
                              ) : (
                                <p className="text-sm font-medium">{s.title}</p>
                              )}
                              {s.kind !== "statistics" && (
                                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                  {s.excerpt}
                                </p>
                              )}
                            </article>
                          ))}
                        </section>
                      )}
                      <p className="text-xs text-slate-500">
                        Corpus consulté : {result.coverage.researchers} profils
                        · {result.coverage.doctorants} doctorants ·{" "}
                        {result.coverage.indexed_publications} publications
                        indexées. Les réponses concernent les données
                        disponibles.
                      </p>
                    </>
                  )}
                </div>
              </Motion.div>
            </Motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
