import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Compass,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { surfaceClasses } from '../../lib/surface-classes';
import { cn } from '../../lib/utils/cn';
import { booths } from '../../lib/data';
import { useMapStore } from '../../stores/mapStore';
import { progress } from '../../lib/matching/candidate';
import { loadCorpus, runMatching } from '../../lib/matching/client';
import type {
  Answers,
  Axis,
  Corpus,
  Option,
  Question,
  Result,
} from '../../lib/matching/types';

const STORAGE_KEY = 'icd_matching_answers';
const AXES: Axis[] = ['tech', 'data', 'biz', 'ops', 'people', 'create'];

function readAnswers(): Answers {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Answers) : {};
  } catch {
    return {};
  }
}

function saveAnswers(answers: Answers) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // Private mode: progress simply won't persist.
  }
}

/* ------------------------------------------------------------------ */
/* Spot illustration                                                   */
/* ------------------------------------------------------------------ */

function QuestionArt({ id, large = false }: { id: string; large?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        'relative shrink-0',
        large ? 'size-24 sm:size-60' : 'size-16 sm:size-20',
      )}
    >
      {!loaded && !failed && (
        <div className="skeleton-shimmer absolute inset-0" aria-hidden="true" />
      )}
      {failed ? (
        <div className="flex size-full items-center justify-center border border-dashed border-line text-[#6b6b73]">
          <Compass size={large ? 44 : 22} strokeWidth={1.6} />
        </div>
      ) : (
        <img
          src={`/images/matching/${id}.png`}
          alt=""
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'size-full select-none object-contain transition-opacity duration-200',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeletons                                                           */
/* ------------------------------------------------------------------ */

function QuizSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-hidden p-4 sm:p-6">
      <div className="skeleton-shimmer h-3 w-32" />
      <div className="skeleton-shimmer mt-3 h-7 w-3/4" />
      <div className="skeleton-shimmer mt-2 h-7 w-1/2" />
      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton-shimmer h-12" />
        ))}
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="text-[0.6875rem] uppercase tracking-[0.12em] text-[#8f8f8f]">
        Menyusun rekomendasi booth...
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="skeleton-shimmer size-20 rounded-full" />
        <div className="flex-1">
          <div className="skeleton-shimmer h-3 w-40" />
          <div className="skeleton-shimmer mt-2 h-3 w-56" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton-shimmer h-12" />
        ))}
      </div>
      <div className="mt-5 space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="skeleton-shimmer h-24" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Results                                                            */
/* ------------------------------------------------------------------ */

function RadarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const size = 190;
  const center = size / 2;
  const radius = 54;
  const angle = (index: number) => -Math.PI / 2 + (index * Math.PI) / 3;
  const point = (index: number, value: number) => {
    const r = (Math.max(1, Math.min(5, value)) / 5) * radius;
    return [center + Math.cos(angle(index)) * r, center + Math.sin(angle(index)) * r] as const;
  };
  const rings = [0.25, 0.5, 0.75, 1];
  const shape = values.map((value, index) => point(index, value).join(',')).join(' ');
  const shortLabel = (label: string) => {
    const head = label.split(' dan ')[0].split(' ')[0];
    return head.charAt(0).toUpperCase() + head.slice(1);
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="size-[190px]" role="img" aria-label="Sebaran minat">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={values.map((_, index) => point(index, ring * 5).join(',')).join(' ')}
          fill="none"
          stroke="#2a2a2e"
          strokeWidth="1"
        />
      ))}
      {values.map((_, index) => {
        const [x, y] = point(index, 5);
        return (
          <line key={index} x1={center} y1={center} x2={x} y2={y} stroke="#2a2a2e" strokeWidth="1" />
        );
      })}
      <motion.polygon
        points={shape}
        fill="var(--accent-pink)"
        fillOpacity={0.2}
        stroke="var(--accent-pink)"
        strokeWidth={1.5}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'center' }}
      />
      {values.map((value, index) => {
        const [x, y] = point(index, value);
        return <circle key={index} cx={x} cy={y} r={2.4} fill="#fff" />;
      })}
      {values.map((_, index) => {
        const lx = center + Math.cos(angle(index)) * (radius + 15);
        const ly = center + Math.sin(angle(index)) * (radius + 13);
        const anchor = lx > center + 4 ? 'start' : lx < center - 4 ? 'end' : 'middle';
        return (
          <text
            key={`label-${index}`}
            x={lx}
            y={ly}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={8}
            fill="#8f8f8f"
          >
            {shortLabel(labels[index] ?? '')}
          </text>
        );
      })}
    </svg>
  );
}

const ResultsView = memo(function ResultsView({
  result,
  corpus,
  onReset,
  onEditAnswer,
  onClose,
}: {
  result: Result;
  corpus: Corpus;
  onReset: () => void;
  onEditAnswer: (questionId: string) => void;
  onClose: () => void;
}) {
  const { labels } = corpus;
  const reduceMotion = useReducedMotion() ?? false;
  const top = result.cards[0];
  const top3 = result.cards.slice(0, 3);
  const aspects = top?.lineage.aspects ?? [];
  const aspectTotal =
    aspects.reduce((sum, aspect) => sum + Math.max(0, aspect.contribution), 0) || 1;
  const axisRows = AXES.map((axis) => ({
    key: axis,
    label: labels.axis[axis],
    value: result.interest.scaled[axis],
  }));
  const axisTotal = axisRows.reduce((sum, row) => sum + row.value, 0) || 1;
  const palette = ['#ff2d6f', '#fafafa', '#a1a1aa', '#71717a', '#52525b', '#3f3f46'];
  let acc = 0;
  const stops = axisRows
    .map((row, index) => {
      const start = (acc / axisTotal) * 360;
      acc += row.value;
      const end = (acc / axisTotal) * 360;
      return `${palette[index]} ${start}deg ${end}deg`;
    })
    .join(', ');

  const visitBooth = () => {
    const booth = top ? booths.find((item) => item.code === top.ref) : undefined;
    if (booth) useMapStore.getState().selectBooth(booth.id);
    onClose();
  };

  return (
    <>
      <header className="relative flex shrink-0 items-center justify-center border-b border-line px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 font-heading text-[0.9375rem] font-bold uppercase tracking-[0.06em] text-white">
          <Sparkles size={14} strokeWidth={2} fill="currentColor" />
          Job Matcher
        </span>
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            aria-label="Ulangi"
            title="Ulangi"
            className="flex size-8 items-center justify-center text-white/70 transition-colors hover:text-white"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex size-8 items-center justify-center text-white/70 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 sm:px-4">
        <div className="grid border-b border-line sm:grid-cols-2 sm:divide-x sm:divide-line">
          {/* Left: pie + top 3 + reserved Sparky space. */}
          <div className="flex flex-col p-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="relative size-28 shrink-0 rounded-full"
                style={{ background: `conic-gradient(${stops})` }}
                initial={reduceMotion ? false : { scale: 0.86, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="absolute inset-[22%] flex items-center justify-center rounded-full bg-[#0c0c0f]">
                  <span className="font-heading text-[1.25rem] font-bold text-white">
                    {Math.round(top?.score ?? 0)}
                  </span>
                </div>
              </motion.div>
              <div className="min-w-0 flex-1 space-y-1">
                {axisRows.map((row, index) => (
                  <div key={row.key} className="flex items-center gap-1.5 text-[0.6875rem]">
                    <span
                      className="size-1.5 shrink-0"
                      style={{ backgroundColor: palette[index] }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[#a1a1aa]">{row.label}</span>
                    <span className="tabular-nums text-white">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t border-line pt-2">
              <div className="text-[0.75rem] text-[#8f8f8f]">Tiga teratas</div>
              {top3.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.22,
                    delay: reduceMotion ? 0 : 0.06 + index * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex items-baseline gap-2 py-1.5"
                >
                  <span className="w-4 font-heading text-[0.6875rem] font-bold text-[#8f8f8f]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.8125rem] font-semibold text-white">
                      {card.role}
                    </div>
                    <div className="truncate text-[0.6875rem] text-[#8f8f8f]">
                      {card.company} · {card.ref}
                    </div>
                    <div className="mt-1 h-0.5 w-full bg-[#26262b]">
                      <motion.div
                        className="h-full bg-white"
                        initial={reduceMotion ? false : { width: 0 }}
                        animate={{ width: `${card.score}%` }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.3,
                          delay: reduceMotion ? 0 : 0.1 + index * 0.05,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    </div>
                  </div>
                  <span className="font-heading text-[0.8125rem] font-bold tabular-nums text-white">
                    {Math.round(card.score)}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Breathing space reserved for the Sparky art. */}
            <div className="mt-4 flex-1 border-t border-line pt-3" aria-hidden="true">
              <div className="h-24 border border-dashed border-[#2a2a2e]" />
            </div>
          </div>

          {/* Right: recommended role, booth, CTA, result stats. */}
          <div className="min-w-0 p-4">
            <h2 className="text-balance font-heading text-[1.25rem] font-bold leading-tight text-white">
              {top?.role ?? 'Belum ada rekomendasi'}
            </h2>
            {top && (
              <div className="mt-0.5 text-[0.8125rem] leading-snug text-[#d4d4d8]">
                {top.company} · Booth {top.ref}
              </div>
            )}
            {top && top.why.length > 0 && (
              <p className="mt-2 text-[0.75rem] leading-snug text-[#a1a1aa]">
                {top.why.slice(0, 2).join(' · ')}
              </p>
            )}
            <button
              type="button"
              onClick={visitBooth}
              className="mt-3 inline-flex min-h-9 items-center gap-1.5 bg-white px-3 font-heading text-[0.75rem] font-bold text-black transition-colors hover:bg-[#e5e5e5]"
            >
              Visit booth
            </button>

            <div className="mt-4 grid grid-cols-3 gap-px border border-line bg-[#232326]">
              {[
                ['Skor', String(Math.round(top?.score ?? 0))],
                ['Kelengkapan', `${Math.round(result.coverage * 100)}%`],
                ['Kejelasan', `${Math.round(result.interest.clarity * 100)}%`],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#0e0e11] p-2">
                  <div className="text-[0.625rem] text-[#8f8f8f]">{label}</div>
                  <div className="mt-0.5 font-heading text-[1.125rem] font-bold text-white">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2 flex items-center justify-center border border-line p-2">
              <RadarChart
                values={axisRows.map((row) => row.value)}
                labels={axisRows.map((row) => row.label)}
              />
            </div>
          </div>
        </div>

        {/* How the result was built: one stepper row per answer. */}
        <section className="p-4">
          <h3 className="font-heading text-[1rem] font-bold text-white">
            Cara hasil ini disusun
          </h3>
          <p className="mt-1 text-[0.75rem] leading-snug text-[#8f8f8f]">
            Setiap jawaban menambah atau mengurangi skor ke peran yang cocok.
          </p>
          {aspects.length > 0 && (
            <div className="mt-3">
              <div className="flex h-2 w-full overflow-hidden bg-[#26262b]">
                {aspects.map((aspect, index) => (
                  <motion.span
                    key={aspect.aspect}
                    className="h-full"
                    style={{ backgroundColor: palette[index % palette.length] }}
                    initial={reduceMotion ? false : { width: 0 }}
                    animate={{
                      width: `${(Math.max(0, aspect.contribution) / aspectTotal) * 100}%`,
                    }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.35,
                      delay: reduceMotion ? 0 : 0.05 * index,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                ))}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                {aspects.map((aspect, index) => (
                  <span
                    key={aspect.aspect}
                    className="inline-flex items-center gap-1 text-[0.625rem] text-[#8f8f8f]"
                  >
                    <span
                      className="size-1.5 shrink-0"
                      style={{ backgroundColor: palette[index % palette.length] }}
                    />
                    {labels.aspect[aspect.aspect] ?? aspect.label}{' '}
                    {Math.round((Math.max(0, aspect.contribution) / aspectTotal) * 100)}%
                  </span>
                ))}
              </div>
            </div>
          )}
          <ol className="mt-3">
            {result.answers.map((trace, index) => (
              <motion.li
                key={trace.question}
                className="flex gap-3"
                initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.22,
                  delay: reduceMotion ? 0 : 0.02 * index,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="flex flex-col items-center">
                  <span className="flex size-6 shrink-0 items-center justify-center border border-line font-heading text-[0.625rem] tabular-nums text-[#a1a1aa]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {index < result.answers.length - 1 && (
                    <span className="w-px flex-1 bg-[#26262b]" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[0.75rem] font-semibold leading-snug text-white">
                      {trace.q}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditAnswer(trace.question)}
                      className="shrink-0 text-[0.625rem] text-[#8f8f8f] underline underline-offset-2 hover:text-white"
                    >
                      Ubah
                    </button>
                  </div>
                  <div className="text-[0.75rem] leading-snug text-[#d4d4d8]">
                    {trace.answer}
                  </div>
                  <div className="text-[0.6875rem] leading-snug text-[#8f8f8f]">
                    {trace.effect}
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
          <div className="mt-2 border-t border-line pt-3 text-[0.6875rem] leading-snug text-[#8f8f8f]">
            Hasil ini cuma buat seru-seruan, bukan penentu karier.
          </div>
        </section>
      </div>
    </>
  );
});


/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export default function MatchingModal() {
  const [open, setOpen] = useState(false);
  const [corpus, setCorpus] = useState<Corpus | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [answers, setAnswers] = useState<Answers>(readAnswers);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [result, setResult] = useState<Result | null>(null);
  const [computing, setComputing] = useState(false);
  const [runError, setRunError] = useState(false);
  const [askClose, setAskClose] = useState(false);
  const [focusVersion, setFocusVersion] = useState(0);
  const reduceMotion = useReducedMotion() ?? false;
  const openerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const progressInfo = useMemo(
    () => (corpus ? progress(answers, corpus.questions) : null),
    [corpus, answers],
  );

  const compute = useCallback(async (nextAnswers: Answers) => {
    setComputing(true);
    setRunError(false);
    setResult(null);
    try {
      const next = await runMatching(nextAnswers);
      setResult(next);
    } catch (error) {
      console.error('[matching] run failed', error);
      setRunError(true);
    } finally {
      setComputing(false);
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setAskClose(false);
    window.requestAnimationFrame(() => openerRef.current?.focus());
  }, []);

  const requestClose = useCallback(() => {
    const answered = progressInfo?.answered ?? Object.keys(answers).length;
    if (!result && answered > 0) {
      setAskClose(true);
      return;
    }
    close();
  }, [answers, close, progressInfo, result]);

  const reset = useCallback(() => {
    setAnswers({});
    saveAnswers({});
    setResult(null);
    setComputing(false);
    setRunError(false);
    setStep(0);
    setDirection(-1);
  }, []);

  /* Open event + scroll lock + focus */
  useEffect(() => {
    const onOpen = () => {
      openerRef.current = (document.activeElement as HTMLElement) ?? null;
      setOpen(true);
    };
    window.addEventListener('icd:open-matching', onOpen);
    return () => window.removeEventListener('icd:open-matching', onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const raf = window.requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      document.body.style.overflow = previous;
      window.cancelAnimationFrame(raf);
    };
  }, [open, focusVersion]);

  /* Lazy corpus: only fetched when the modal opens. */
  useEffect(() => {
    if (!open || corpus) return;
    let alive = true;
    setLoadError(false);
    loadCorpus()
      .then((next) => {
        if (alive) setCorpus(next);
      })
      .catch((error) => {
        console.error('[matching] corpus failed', error);
        if (alive) setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, [open, corpus]);

  /* Resume point + auto-run for already-complete answers. */
  useEffect(() => {
    if (!open || !corpus) return;
    const p = progress(answers, corpus.questions);
    if (p.done) {
      if (!result && !computing) void compute(answers);
      return;
    }
    if (p.next) {
      const index = corpus.questions.findIndex((question) => question.id === p.next?.id);
      if (index >= 0) setStep(index);
    }
  }, [open, corpus]);

  /* Escape always resolves the modal (or the close confirmation). */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (askClose) setAskClose(false);
      else requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, askClose, requestClose]);

  const choose = useCallback((question: Question, option: Option) => {
    setAnswers((current) => {
      const next = { ...current, [question.id]: option.id };
      saveAnswers(next);
      return next;
    });
  }, []);

  const advance = useCallback(
    (override?: Answers) => {
      if (!corpus) return;
      const current = override ?? answers;
      const question = corpus.questions[step];
      if (!question || !current[question.id]) return;
      if (step >= corpus.questions.length - 1) {
        void compute(current);
        return;
      }
      setDirection(1);
      setStep((value) => value + 1);
    },
    [answers, compute, corpus, step],
  );

  const back = useCallback(() => {
    setDirection(-1);
    setStep((value) => Math.max(0, value - 1));
  }, []);

  const editAnswer = useCallback(
    (questionId: string) => {
      if (!corpus) return;
      const index = corpus.questions.findIndex((question) => question.id === questionId);
      setResult(null);
      setComputing(false);
      setDirection(-1);
      setStep(Math.max(0, index));
      setFocusVersion((value) => value + 1);
    },
    [corpus],
  );

  /* Quiz keyboard: options, advance, back. */
  useEffect(() => {
    if (!open || !corpus || result || computing || askClose) return;
    const question = corpus.questions[step];
    if (!question) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        advance();
        return;
      }
      if (event.key === 'Backspace' || event.key === 'ArrowLeft') {
        event.preventDefault();
        back();
        return;
      }
      const index = /^[1-6]$/.test(event.key)
        ? Number(event.key) - 1
        : /^[a-f]$/i.test(event.key)
          ? event.key.toLowerCase().charCodeAt(0) - 97
          : -1;
      const option = index >= 0 ? question.opts[index] : undefined;
      if (option) {
        event.preventDefault();
        choose(question, option);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, askClose, back, choose, computing, corpus, open, result, step]);

  if (!open) return null;

  const question = corpus?.questions[step];
  const answered = progressInfo?.answered ?? 0;
  const total = corpus?.questions.length ?? 12;
  const last = corpus ? step === corpus.questions.length - 1 : false;
  const skipOption = question?.opts.find((option) => option.v === null);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[220] flex items-stretch justify-center bg-black/80 sm:items-center sm:p-4"
      role="presentation"
      onClick={requestClose}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Career Match"
        tabIndex={-1}
        initial={
          reduceMotion ? false : { opacity: 0, y: 44, scale: 0.985 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 420, damping: 38, mass: 0.9 }
        }
        className={cn(
          'relative flex h-[100dvh] w-full flex-col overflow-hidden border-[8px] border-[#2a2a2e] text-white outline-none sm:h-[min(90dvh,860px)] sm:max-w-[720px] sm:rounded-[8px]',
          surfaceClasses(1, 6),
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {computing ? (
          <ResultsSkeleton />
        ) : result && corpus ? (
          <ResultsView
            result={result}
            corpus={corpus}
            onReset={reset}
            onEditAnswer={editAnswer}
            onClose={close}
          />
        ) : loadError || runError ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-[0.875rem] text-[#d4d4d8]">
              Mesin matching belum bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => {
                setLoadError(false);
                setRunError(false);
                if (runError) void compute(answers);
              }}
              className="min-h-10 bg-white px-3 font-heading text-[0.75rem] font-bold text-black"
            >
              Coba lagi
            </button>
            <button
              type="button"
              onClick={close}
              className="mt-1 text-[0.75rem] text-[#8f8f8f] hover:text-white"
            >
              Tutup
            </button>
          </div>
        ) : !corpus || !question ? (
          <>
            <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-2.5">
              <div className="font-heading text-[1rem] font-bold">Career Match</div>
              <button
                type="button"
                onClick={requestClose}
                aria-label="Tutup"
                className="flex size-9 items-center justify-center text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <QuizSkeleton />
          </>
        ) : (
          <>
            {/* Header: centered white Job Matcher block + close, then divider. */}
            <header className="relative flex shrink-0 items-center justify-center border-b border-line px-3 py-2.5">
              <span className="inline-flex items-center gap-1.5 font-heading text-[0.9375rem] font-bold uppercase tracking-[0.06em] text-white">
                <Sparkles size={14} strokeWidth={2} fill="currentColor" />
                Job Matcher
              </span>
              <button
                type="button"
                onClick={requestClose}
                aria-label="Tutup"
                className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center text-white/70 transition-colors hover:text-white"
              >
                <X size={18} />
              </button>
            </header>

            {/* 1/4 side gutters, 1/2 content column with vertical hairlines. */}
            <div className="flex min-h-0 flex-1">
              <div className="hidden sm:block sm:w-1/4" aria-hidden="true" />
              <div className="flex min-h-0 w-full flex-col sm:w-1/2 sm:border-x sm:border-line">
                {/* Index + segmented stepper */}
                <div className="shrink-0 border-b border-line px-3 pb-2.5 pt-2 text-center">
                  <div className="font-heading text-[0.875rem] font-bold tabular-nums text-white">
                    {answered} / {total}
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={answered}
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-label="Progres kuis"
                    className="mt-1.5 flex gap-0.5"
                  >
                    {Array.from({ length: total }).map((_, index) => (
                      <span
                        key={index}
                        className={cn(
                          'h-1 flex-1',
                          index < answered ? 'bg-[var(--accent-pink)]' : 'bg-[#26262b]',
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Stage: centered items, centered question. */}
                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-6">
                  <div
                    key={question.id}
                    className={cn(
                      'flex flex-col items-center',
                      direction === 1 ? 'matching-forward' : 'matching-back',
                    )}
                  >
                    <QuestionArt id={question.id} large />
                    <p className="mt-6 text-center text-[0.625rem] uppercase tracking-[0.12em] text-[#8f8f8f]">
                      Pilih jawabanmu
                    </p>
                    <h2 className="mt-1.5 w-full text-center text-balance font-heading text-[1.375rem] font-bold leading-tight tracking-[-0.2px] text-white sm:text-[1.5rem]">
                      {question.q}
                    </h2>
                    {skipOption && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = { ...answers, [question.id]: skipOption.id };
                          setAnswers(next);
                          saveAnswers(next);
                          advance(next);
                        }}
                        className="mt-2 min-h-9 px-2 text-[0.75rem] font-semibold text-[#8f8f8f] underline underline-offset-4 hover:text-white"
                      >
                        Lewati
                      </button>
                    )}
                    <div className="mt-4 flex w-full flex-col gap-2">
                      {question.opts.map((option, index) => {
                        const selected = answers[question.id] === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => choose(question, option)}
                            aria-pressed={selected}
                            className={cn(
                              'flex min-h-14 w-full items-start gap-3 border px-3 py-3 text-left text-base font-semibold leading-relaxed transition-colors active:scale-[0.99] sm:min-h-12 sm:items-center sm:gap-2.5 sm:px-2.5 sm:py-2 sm:text-[0.8125rem] sm:leading-snug',
                              selected
                                ? 'border-white bg-white text-black'
                                : 'border-line bg-[#141416] text-[#d4d4d8] hover:border-[#4a4a52] hover:text-white',
                            )}
                          >
                            <span
                              className={cn(
                                'mt-0.5 flex size-6 shrink-0 items-center justify-center border font-heading text-[0.6875rem] font-bold sm:mt-0 sm:size-5 sm:text-[0.625rem]',
                                selected
                                  ? 'border-black/20 bg-black text-white'
                                  : 'border-line text-[#8f8f8f]',
                              )}
                            >
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="min-w-0 flex-1 whitespace-normal break-words text-pretty">
                              {option.t}
                            </span>
                            {selected && (
                              <Check size={14} strokeWidth={3} className="mt-1 shrink-0 sm:mt-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer: full-width thumb buttons on mobile, compact on desktop. */}
                <footer className="shrink-0 border-t border-line px-3 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-2.5 sm:p-2.5">
                  <div className="flex w-full items-center gap-2 sm:justify-center">
                    <button
                      type="button"
                      onClick={back}
                      disabled={step === 0}
                      className="inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-[2px] border border-line px-3 text-[0.8125rem] font-semibold text-white transition-colors hover:border-[#4a4a52] disabled:cursor-not-allowed disabled:opacity-30 sm:min-h-9 sm:flex-none sm:text-[0.75rem]"
                    >
                      <ArrowLeft size={14} strokeWidth={2.2} />
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={() => advance()}
                      disabled={!answers[question.id]}
                      className="inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-[2px] bg-white px-3 font-heading text-[0.8125rem] font-bold text-black transition-colors hover:bg-[#e5e5e5] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9 sm:flex-none sm:text-[0.75rem]"
                    >
                      {last ? 'Lihat Hasil' : 'Lanjut'}
                      <span className="inline-flex min-h-4 min-w-4 items-center justify-center border border-black/25 px-1 text-[0.625rem] leading-none">
                        ↵
                      </span>
                    </button>
                  </div>
                </footer>
              </div>
              <div className="hidden sm:block sm:w-1/4" aria-hidden="true" />
            </div>
          </>
        )}

        {askClose && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4"
            role="presentation"
            onClick={() => setAskClose(false)}
          >
            <div
              className="w-full max-w-[320px] border border-[#2a2a2e] bg-[#0c0c0f] p-4 text-white"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="font-heading text-[1rem] font-bold">Tutup Career Match?</div>
              <p className="mt-1 text-[0.75rem] leading-snug text-[#8f8f8f]">
                Progresmu tersimpan. Kamu bisa melanjutkan kapan saja.
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAskClose(false)}
                  className="min-h-9 border border-line px-3 text-[0.75rem] font-semibold text-white"
                >
                  Lanjutkan
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="min-h-9 bg-white px-3 font-heading text-[0.75rem] font-bold text-black"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
