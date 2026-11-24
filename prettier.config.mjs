export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  plugins: ['prettier-plugin-astro', 'prettier-plugin-tailwindcss'],
  // Tailwind v4 is CSS-first: there is no tailwind.config.js, so the plugin
  // needs the stylesheet that contains `@import 'tailwindcss'` in order to
  // resolve the canonical class order. Without this it cannot sort utilities.
  tailwindStylesheet: './src/styles/base/global.css',
  // Class helpers used across the codebase; without these their string
  // arguments are treated as plain text and never sorted.
  tailwindFunctions: ['cn', 'clsx', 'cva', 'tv'],
  overrides: [
    {
      files: '*.astro',
      options: { parser: 'astro' },
    },
  ],
};
