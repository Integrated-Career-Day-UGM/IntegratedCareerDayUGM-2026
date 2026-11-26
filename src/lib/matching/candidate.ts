import type { Answers, AnswerTrace, Axis, Candidate, Corpus, Question } from './types';

export const AXES: Axis[] = ['tech', 'data', 'biz', 'ops', 'people', 'create'];

const zeroAxes = (): Record<Axis, number> => ({
  tech: 0,
  data: 0,
  biz: 0,
  ops: 0,
  people: 0,
  create: 0,
});

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const r2 = (x: number) => Math.round(x * 100) / 100;

export function progress(answers: Answers, questions: Question[]) {
  const answered = questions.filter((q) => q.opts.some((o) => o.id === answers[q.id])).length;
  const next = questions.find((q) => !q.opts.some((o) => o.id === answers[q.id])) ?? null;
  return { answered, total: questions.length, done: answered === questions.length, next };
}

export function buildCandidate(answers: Answers, corpus: Pick<Corpus, 'questions'>) {
  const cand: Candidate = {
    campus: 2,
    level: 3,
    stage: 1,
    gpa: null,
    major: null,
    region: 'all',
    want: 'any',
    interest: { tech: 3, data: 3, biz: 3, ops: 3, people: 3, create: 3 },
  };

  const raw = zeroAxes();
  const trace: AnswerTrace[] = [];
  const missing: string[] = [];

  for (const q of corpus.questions) {
    const opt = q.opts.find((o) => o.id === answers[q.id]);
    if (!opt) {
      missing.push(q.id);
      continue;
    }

    if (q.kind === 'profile' && q.field) {
      (cand as unknown as Record<string, unknown>)[q.field] = opt.v ?? null;
      const neutral = opt.v === null || opt.v === 'all' || opt.v === 'any';
      trace.push({
        question: q.id,
        q: q.q,
        answer: opt.t,
        effect: `${q.field} = ${opt.v ?? 'null'}`,
        info: neutral ? 0.5 : 1,
      });
    } else {
      const pts = Object.entries(opt.a ?? {}) as [Axis, number][];
      for (const [axis, delta] of pts) raw[axis] += delta;
      trace.push({
        question: q.id,
        q: q.q,
        answer: opt.t,
        effect: pts.map(([axis, delta]) => `+${delta} ${axis}`).join(', '),
        info: 1,
      });
    }
  }

  const totalPts = AXES.reduce((sum, a) => sum + raw[a], 0);
  const maxPts = Math.max(...AXES.map((a) => raw[a]));
  const scaled: Record<Axis, number> = { ...cand.interest };
  for (const axis of AXES) {
    scaled[axis] = maxPts === 0 ? 3 : 1 + Math.round((4 * raw[axis]) / maxPts);
  }
  cand.interest = scaled;

  const sorted = AXES.map((a) => raw[a]).sort((x, y) => y - x);
  const clarity =
    totalPts === 0 ? 0 : clamp01(((sorted[0] + sorted[1]) / totalPts - 2 / 6) / (1 - 2 / 6));
  const coverage =
    corpus.questions.length === 0
      ? 0
      : trace.reduce((sum, t) => sum + t.info, 0) / corpus.questions.length;

  return {
    candidate: cand,
    trace,
    missing,
    interest: { raw, scaled, clarity: r2(clarity) },
    coverage: r2(coverage),
  };
}
