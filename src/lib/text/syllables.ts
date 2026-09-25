/**
 * CLAUDE.md §8.4: Vietnamese words are counted as syllables (tiếng), split by spaces.
 * A token counts only if it holds at least one letter or digit (so "—" or "..." do not count).
 */
export function countSyllables(text: string): number {
  return text
    .replace(/\[\^[^\]]+\]/g, ' ') // footnote markers
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}
