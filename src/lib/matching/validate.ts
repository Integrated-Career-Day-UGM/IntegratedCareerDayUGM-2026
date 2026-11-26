import { AXES } from './candidate';
import type { Axis, Corpus } from './types';

export function validateCorpus(corpus: Corpus): string[] {
  const issues: string[] = [];
  const majors = new Set(corpus.majors.map((m) => m.id));
  const ids = new Set<string>();

  for (const r of corpus.roles) {
    if (ids.has(r.id)) issues.push(`role duplikat: ${r.id}`);
    ids.add(r.id);
    if (!corpus.booths[r.b]) issues.push(`${r.id}: booth "${r.b}" tidak ada`);
    if (r.mj !== 'any') {
      for (const m of r.mj) {
        if (!majors.has(m)) issues.push(`${r.id}: jurusan "${m}" tidak dikenal`);
      }
    }
    for (const a of Object.keys(r.ax)) {
      if (!AXES.includes(a as Axis)) issues.push(`${r.id}: axis "${a}" tidak dikenal`);
    }
    if (r.lv[0] > r.lv[1] || r.st[0] > r.st[1]) issues.push(`${r.id}: rentang lv/st terbalik`);
  }

  for (const q of corpus.questions) {
    if (q.kind === 'profile' && !q.field) issues.push(`pertanyaan ${q.id}: field kosong`);
    if (new Set(q.opts.map((o) => o.id)).size !== q.opts.length) {
      issues.push(`pertanyaan ${q.id}: id opsi duplikat`);
    }
  }

  const wsum = Object.values(corpus.params.confidence.weights).reduce((s, x) => s + x, 0);
  if (Math.abs(wsum - 1) > 1e-6) {
    issues.push(`bobot confidence berjumlah ${wsum}, harus 1`);
  }

  return issues;
}
