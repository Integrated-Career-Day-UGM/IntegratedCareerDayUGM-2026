/**
 * Gate for authoring/debug tooling: the GeometryEditor, the GIK zoom tuner
 * (localStorage override), the window.__icd* console probes, and the CAM
 * debug panel.
 *
 * `import.meta.env.DEV` is a Vite build-mode constant: true under `astro dev`,
 * always false in `astro build` — on any host, no matter what environment
 * variables are set. To keep these tools available on a deployed staging build
 * (still a proper production bundle), set PUBLIC_DEV_TOOLS=true in the staging
 * build environment (Vercel → Settings → Environment Variables → Preview).
 * Leave it unset for production; the branches then constant-fold away and the
 * tool code tree-shakes out of the bundle.
 */
export const DEV_TOOLS =
  import.meta.env.DEV || import.meta.env.PUBLIC_DEV_TOOLS === 'true';
