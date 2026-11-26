import { buildCandidate, clamp01, r2 } from './candidate';
import type {
  Answers,
  Aspect,
  AspectTrace,
  Axis,
  Candidate,
  Card,
  Corpus,
  Lineage,
  Result,
  Rng,
  Role,
} from './types';

interface Crit {
  aspect: Aspect;
  key: string;
  label: string;
  core: boolean;
  gap: number;
  have: string;
  need: string;
  note?: string;
}

const rangeGap = (v: number, [lo, hi]: Rng) => (v < lo ? v - lo : v > hi ? hi - v : 0);

function buildCriteria(cand: Candidate, role: Role, corpus: Corpus): Crit[] {
  const { params: P, labels: L } = corpus;
  const out: Crit[] = [];

  const add = (
    aspect: Aspect,
    key: string,
    core: boolean,
    gap: number,
    have: string,
    need: string,
    note?: string,
  ) => {
    out.push({
      aspect,
      key,
      label: L.criterion[key] ?? `Minat ${L.axis[key as Axis]}`,
      core,
      gap,
      have,
      need,
      note,
    });
  };

  const rngLabel = (v: Rng, names: string[], all: string) =>
    v[0] === 1 && v[1] === names.length - 1
      ? all
      : v[0] === v[1]
        ? names[v[0]]
        : v[1] === names.length - 1
          ? `${names[v[0]]} ke atas`
          : `${names[v[0]]} - ${names[v[1]]}`;

  const majorLabel = (id: string) => corpus.majors.find((m) => m.id === id)?.label ?? id;

  add(
    'eligibility',
    'campus',
    true,
    rangeGap(cand.campus, role.campus ? [role.campus, role.campus] : [1, 2]),
    L.campus[cand.campus],
    role.campus ? `Khusus ${L.campus[role.campus]}` : 'Semua kampus',
  );

  add(
    'eligibility',
    'level',
    true,
    rangeGap(cand.level, role.lv),
    L.level[cand.level],
    rngLabel(role.lv, L.level, 'Semua jenjang'),
  );

  add(
    'eligibility',
    'stage',
    true,
    rangeGap(cand.stage, role.st),
    L.stage[cand.stage],
    rngLabel(role.st, L.stage, 'Semua status'),
  );

  if (cand.gpa) {
    add(
      'eligibility',
      'gpa',
      false,
      rangeGap(cand.gpa, [role.gpa, 5]),
      L.gpaCandidate[cand.gpa],
      role.gpa <= 1 ? 'Tanpa batas' : `minimal ${L.gpa[role.gpa]}`,
    );
  }

  let mg: number;
  let mneed: string;
  let mnote: string | undefined;

  if (role.mj === 'any') {
    mg = P.gaps.majorAny;
    mneed = 'Semua jurusan';
    mnote = 'Netral: posisi tidak membatasi jurusan';
  } else {
    mneed = role.mj.map(majorLabel).join('; ');
    const isExact = Boolean(cand.major && role.mj.includes(cand.major));
    const isRelated = Boolean(
      cand.major && role.mj.some((m) => corpus.related[cand.major!]?.includes(m)),
    );
    mg = isExact ? 0 : isRelated ? P.gaps.majorRelated : P.gaps.majorMismatch;
    if (isRelated && mg !== 0) mnote = 'Rumpun berdekatan';
  }

  add('major', 'major', true, mg, cand.major ? majorLabel(cand.major) : 'Lainnya', mneed, mnote);

  for (const [axis, target] of Object.entries(role.ax) as [Axis, number][]) {
    const haveVal = cand.interest[axis] ?? 3;
    add(
      'interest',
      axis,
      target >= P.interestCoreThreshold,
      rangeGap(haveVal, [target, 5]),
      `${haveVal}/5`,
      `minimal ${target}/5`,
    );
  }

  add(
    'fit',
    'type',
    true,
    cand.want === 'any' || cand.want === role.t ? 0 : P.gaps.typeMismatch,
    cand.want === 'any' ? 'Belum menentukan' : L.type[cand.want],
    L.type[role.t],
  );

  add(
    'fit',
    'loc',
    false,
    cand.region === 'all' || role.loc === 'any' || role.loc.includes(cand.region)
      ? 0
      : P.gaps.locMismatch,
    cand.region === 'all' ? 'Di mana saja' : L.region[cand.region],
    role.loc === 'any' ? 'Fleksibel' : role.loc.map((x) => L.region[x]).join(', '),
  );

  return out;
}

function aggregate(cr: Crit[], corpus: Corpus): Lineage {
  const { params: P, labels: L } = corpus;
  const gapWeight = (x: Crit) =>
    P.gapWeights[Math.min(P.gapWeights.length - 1, Math.abs(x.gap))];
  const mean = (list: Crit[]) => list.reduce((sum, x) => sum + gapWeight(x), 0) / list.length;

  const present = (Object.keys(P.aspectWeights) as Aspect[]).filter((a) =>
    cr.some((x) => x.aspect === a),
  );
  const wsum = present.reduce((sum, a) => sum + P.aspectWeights[a], 0);

  let total = 0;
  const aspects: AspectTrace[] = present.map((aspect) => {
    const xs = cr.filter((x) => x.aspect === aspect);
    const core = xs.filter((x) => x.core);
    const sec = xs.filter((x) => !x.core);
    const ncf = core.length ? mean(core) : null;
    const nsf = sec.length ? mean(sec) : null;
    const value =
      ncf === null
        ? (nsf as number)
        : nsf === null
          ? ncf
          : P.coreShare * ncf + (1 - P.coreShare) * nsf;
    const weight = wsum === 0 ? 0 : P.aspectWeights[aspect] / wsum;
    total += weight * value;

    return {
      aspect,
      label: L.aspect[aspect],
      weight: r2(weight),
      ncf: ncf === null ? null : r2(ncf),
      nsf: nsf === null ? null : r2(nsf),
      value: r2(value),
      contribution: r2(weight * value),
      criteria: xs.map((x) => ({
        key: x.key,
        label: x.label,
        core: x.core,
        have: x.have,
        need: x.need,
        gap: x.gap,
        weight: gapWeight(x),
        note: x.note,
      })),
    };
  });

  const cs = P.coreShare;
  const ss = r2(1 - P.coreShare);
  return {
    aspects,
    total: r2(total),
    score: Math.round(((total - 1) / 4) * 100),
    formula: `skor = (Σ bobot_aspek × (${cs}·NCF + ${ss}·NSF) − 1) / 4 × 100`,
  };
}

function whyOf(cand: Candidate, role: Role, cr: Crit[]): string[] {
  const out: string[] = [];
  const find = (k: string) => cr.find((x) => x.key === k);

  if (role.mj !== 'any' && find('major')?.gap === 0) out.push('Jurusan sesuai');
  cr
    .filter((x) => x.aspect === 'interest' && x.core && x.gap === 0)
    .slice(0, 2)
    .forEach((x) => out.push(`${x.label} kuat`));

  const loc = find('loc');
  if (loc && role.loc !== 'any' && cand.region !== 'all' && loc.gap === 0) {
    out.push(`Penempatan ${loc.need}`);
  }

  const type = find('type');
  if (type && cand.want !== 'any' && type.gap === 0) {
    out.push('Sesuai jenis program yang dicari');
  }

  return out.slice(0, 3);
}

export function recommend(answers: Answers, corpus: Corpus, n?: number): Result {
  const P = corpus.params;
  const built = buildCandidate(answers, corpus);
  const cand = built.candidate;

  const scored = corpus.roles
    .filter((r) => Boolean(corpus.booths[r.b]))
    .map((role): Card => {
      const cr = buildCriteria(cand, role, corpus);
      const lineage = aggregate(cr, corpus);
      const bad = cr.filter((x) => x.gap < 0 && !(x.key === 'major' && role.mj === 'any'));
      const blocking = bad.filter((x) => P.blocking.includes(x.key));
      const booth = corpus.booths[role.b];
      const fmt = (x: Crit) => `${x.label}: butuh ${x.need}, kamu ${x.have}`;

      return {
        rank: 0,
        id: role.id,
        booth: role.b,
        ref: booth.ref,
        company: booth.company,
        role: role.r,
        score: lineage.score,
        eligible: blocking.length === 0,
        why: whyOf(cand, role, cr),
        blockers: blocking.map(fmt),
        notes: bad.filter((x) => !P.blocking.includes(x.key)).map(fmt),
        apply: { label: booth.apply.label, url: role.u ?? booth.apply.url },
        deadline: booth.deadline,
        note: role.note,
        src: role.src,
        others: [],
        confidence: {
          value: 0,
          level: 'low',
          parts: { data: 0, coverage: 0, margin: 0, clarity: 0 },
          flags: [],
        },
        lineage,
      };
    });

  scored.sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score);

  const byBooth = new Map<string, Card>();
  for (const item of scored) {
    const existing = byBooth.get(item.booth);
    if (!existing) byBooth.set(item.booth, item);
    else if (existing.others.length < 2) {
      existing.others.push({ id: item.id, role: item.role, score: item.score });
    }
  }

  const ranked = [...byBooth.values()];
  const CP = P.confidence;

  ranked.forEach((card, i) => {
    const next = ranked[i + 1];
    const margin = !next
      ? 1
      : card.eligible && !next.eligible
        ? 1
        : clamp01((card.score - next.score) / CP.marginSaturation);

    const parts = {
      data: P.dataQuality[card.src],
      coverage: built.coverage,
      margin: r2(margin),
      clarity: built.interest.clarity,
    };

    let rawConf = (Object.keys(CP.weights) as (keyof typeof parts)[]).reduce(
      (sum, k) => sum + CP.weights[k] * parts[k],
      0,
    );
    if (!card.eligible) rawConf *= CP.ineligiblePenalty;

    const value = Math.round(rawConf * 100);
    const flags: string[] = [];
    if (!card.eligible) flags.push('Ada syarat wajib yang belum terpenuhi');
    if (card.src === 'inferred') {
      flags.push('Kriteria posisi ini diperkirakan, belum tercantum jelas di poster');
    }
    if (next && margin < 0.3) flags.push(`Selisih tipis dengan ${next.company}`);
    if (built.coverage < 0.8) flags.push('Beberapa jawaban dilewati atau belum diisi');
    if (built.interest.clarity < 0.4) flags.push('Minatmu menyebar, belum ada yang dominan');

    card.confidence = {
      value,
      level:
        value >= CP.levels.high ? 'high' : value >= CP.levels.medium ? 'medium' : 'low',
      parts,
      flags,
    };
    card.rank = i + 1;
  });

  return {
    candidate: cand,
    answers: built.trace,
    interest: built.interest,
    coverage: built.coverage,
    missing: built.missing,
    cards: ranked.slice(0, n ?? P.topN),
    meta: {
      version: corpus.version,
      roles: corpus.roles.length,
      booths: Object.keys(corpus.booths).length,
    },
  };
}
