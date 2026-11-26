import type { Answers, Corpus, Result } from './types';

let corpusPromise: Promise<Corpus> | null = null;
let scorerPromise: Promise<typeof import('./scorer')> | null = null;

export function loadCorpus(): Promise<Corpus> {
  if (!corpusPromise) {
    corpusPromise = import('../../data/icd-matching.json').then(
      (m) => m.default as unknown as Corpus,
    );
  }
  return corpusPromise;
}

export function loadScorer() {
  if (!scorerPromise) {
    scorerPromise = import('./scorer');
  }
  return scorerPromise;
}

export async function runMatching(answers: Answers, topN?: number): Promise<Result> {
  const [corpus, { recommend }] = await Promise.all([loadCorpus(), loadScorer()]);
  return recommend(answers, corpus, topN);
}
