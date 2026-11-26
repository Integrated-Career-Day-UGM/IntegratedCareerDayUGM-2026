const ACRONYMS = new Set(['fmcg', 'bumn', 'it', 'hr', 'qa', 'sme', 'ngo']);

/** "financial-services" → "Financial Services"; known acronyms stay upper. */
export default function humanizeLabel(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w+/g, (word) =>
      ACRONYMS.has(word.toLowerCase())
        ? word.toUpperCase()
        : word[0].toUpperCase() + word.slice(1),
    );
}
