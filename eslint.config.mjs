import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';

export default [
  {
    ignores: [
      'dist',
      '.astro',
      'node_modules',
      'coverage',
      'playwright-report',
      'test-results',
      'public',
      // Vendored Fluid Functionalism kit. Its files carry eslint-disable
      // comments for react-hooks rules from a plugin this repo doesn't install,
      // so every disable reads as "rule not found" (282 errors, zero signal).
      // Install eslint-plugin-react-hooks to bring the kit back under lint.
      'src/components/ui',
      // Agent workspaces: skill scripts and session temp files, not project
      // source. git-ignored, but ESLint walks the filesystem regardless.
      '.agents',
      '.opencode',
      '.github/skills',
      '.github/agents',
      '.github/hooks',
      'graphify-out',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx,astro}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // `@ts-nocheck` stays allowed for WIP files (PixelTransition.tsx);
      // ts-ignore / ts-expect-error misuse still errors.
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-nocheck': false }],
    },
  },
];
