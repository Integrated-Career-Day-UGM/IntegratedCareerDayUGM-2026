export type Axis = 'tech' | 'data' | 'biz' | 'ops' | 'people' | 'create';
export type Region = 'diy' | 'jabodetabek' | 'jatim' | 'lainnya';
export type Want = 'intern' | 'trainee' | 'staff' | 'fellow';
export type Aspect = 'eligibility' | 'major' | 'interest' | 'fit';
export type ProfileField = 'campus' | 'level' | 'stage' | 'gpa' | 'major' | 'want' | 'region';
export type Rng = [number, number];

export interface Candidate {
  campus: 1 | 2;
  level: 1 | 2 | 3 | 4;
  stage: 1 | 2 | 3 | 4;
  gpa: 1 | 2 | 3 | 4 | 5 | null;
  major: string | null;
  region: Region | 'all';
  want: Want | 'any';
  interest: Record<Axis, number>;
}

export interface Role {
  id: string;
  b: string;
  r: string;
  t: Want;
  lv: Rng;
  st: Rng;
  gpa: number;
  mj: string[] | 'any';
  loc: Region[] | 'any';
  ax: Partial<Record<Axis, number>>;
  campus?: 1 | 2;
  u?: string;
  note?: string;
  src: 'poster' | 'web' | 'inferred';
}

export interface Booth {
  company: string;
  ref: string;
  deadline: string | null;
  apply: { label: string; url: string | null };
}

export interface Option {
  id: string;
  t: string;
  v?: number | string | null;
  a?: Partial<Record<Axis, number>>;
}

export interface Question {
  id: string;
  kind: 'profile' | 'interest';
  field?: ProfileField;
  q: string;
  opts: Option[];
}

export interface Params {
  gapWeights: number[];
  aspectWeights: Record<Aspect, number>;
  coreShare: number;
  interestCoreThreshold: number;
  gaps: {
    majorAny: number;
    majorRelated: number;
    majorMismatch: number;
    typeMismatch: number;
    locMismatch: number;
  };
  blocking: string[];
  dataQuality: Record<Role['src'], number>;
  confidence: {
    weights: Record<'data' | 'coverage' | 'margin' | 'clarity', number>;
    marginSaturation: number;
    ineligiblePenalty: number;
    levels: { high: number; medium: number };
  };
  topN: number;
}

export interface Labels {
  level: string[];
  stage: string[];
  gpa: string[];
  gpaCandidate: string[];
  campus: string[];
  type: Record<Want, string>;
  axis: Record<Axis, string>;
  region: Record<Region, string>;
  aspect: Record<Aspect, string>;
  criterion: Record<string, string>;
}

export interface Corpus {
  version: string;
  params: Params;
  labels: Labels;
  questions: Question[];
  majors: { id: string; label: string }[];
  related: Record<string, string[]>;
  booths: Record<string, Booth>;
  roles: Role[];
}

export type Answers = Record<string, string>;

export interface AnswerTrace {
  question: string;
  q: string;
  answer: string;
  effect: string;
  info: number;
}

export interface CriterionTrace {
  key: string;
  label: string;
  core: boolean;
  have: string;
  need: string;
  gap: number;
  weight: number;
  note?: string;
}

export interface AspectTrace {
  aspect: Aspect;
  label: string;
  weight: number;
  ncf: number | null;
  nsf: number | null;
  value: number;
  contribution: number;
  criteria: CriterionTrace[];
}

export interface Lineage {
  aspects: AspectTrace[];
  total: number;
  score: number;
  formula: string;
}

export interface Confidence {
  value: number;
  level: 'high' | 'medium' | 'low';
  parts: { data: number; coverage: number; margin: number; clarity: number };
  flags: string[];
}

export interface Card {
  rank: number;
  id: string;
  booth: string;
  ref: string;
  company: string;
  role: string;
  score: number;
  eligible: boolean;
  why: string[];
  blockers: string[];
  notes: string[];
  apply: Booth['apply'];
  deadline: string | null;
  note?: string;
  src: Role['src'];
  others: { id: string; role: string; score: number }[];
  confidence: Confidence;
  lineage: Lineage;
}

export interface Result {
  candidate: Candidate;
  answers: AnswerTrace[];
  interest: { raw: Record<Axis, number>; scaled: Record<Axis, number>; clarity: number };
  coverage: number;
  missing: string[];
  cards: Card[];
  meta: { version: string; roles: number; booths: number };
}
