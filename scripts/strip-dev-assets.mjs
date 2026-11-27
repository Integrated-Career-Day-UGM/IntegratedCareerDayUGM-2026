/**
 * Remove the dev-tool chunks from a production build.
 *
 * Astro's island scan treats every `client:*` component as a Rollup input even
 * when it sits behind a compile-time-false condition, so the tuner/editors are
 * emitted as unreferenced chunks. They are never loaded (no HTML references
 * them), but they should not ship either. Staging keeps them when
 * PUBLIC_DEV_TOOLS=true, matching the runtime gate in src/lib/dev-tools.ts.
 */
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const PREFIXES = ['MobileLayoutTuner', 'GeometryEditor', 'GeoJsonEditor'];

if (process.env.PUBLIC_DEV_TOOLS !== 'true') {
  const dir = 'dist/_astro';
  let removed = 0;
  for (const file of readdirSync(dir)) {
    if (!PREFIXES.some((prefix) => file.startsWith(`${prefix}.`))) continue;
    rmSync(join(dir, file), { force: true });
    console.log(`[strip-dev] removed ${file}`);
    removed += 1;
  }
  console.log(`[strip-dev] ${removed} dev asset(s) removed`);
}
