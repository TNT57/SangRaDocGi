/**
 * One tone-mark style everywhere (CLAUDE.md §8.5 item 5).
 *
 * Only open syllables with the vowel pairs "oa", "oe", "uy" differ between styles:
 *   - classic ("kiểu cũ", default): hòa, khỏe, thủy  — mark on the first vowel
 *   - modern  ("kiểu mới"):         hoà, khoẻ, thuỷ  — mark on the second vowel
 * Syllables after "qu" (quả, quý) and closed syllables (hoàng, huýt) are the same in both.
 */
export type ToneStyle = 'classic' | 'modern';
export const TONE_STYLE: ToneStyle = 'classic';

const TONES = ['̀', '́', '̉', '̃', '̣'] as const; // huyền sắc hỏi ngã nặng
const TONE_SET = new Set<string>(TONES);

type Split = { base: string; tone: string };

/** Split one NFC character into its letter (with hats/horns kept) and its tone mark. */
function splitChar(ch: string): Split {
  const decomposed = ch.normalize('NFD');
  let base = '';
  let tone = '';
  for (const part of decomposed) {
    if (TONE_SET.has(part)) tone = part;
    else base += part;
  }
  return { base: base.normalize('NFC'), tone };
}

function withTone(base: string, tone: string): string {
  return (base.normalize('NFD') + tone).normalize('NFC');
}

const PAIR = /^(oa|oe|uy)$/;

/** Convert one syllable (letters only) to the target style. Returns it unchanged if not affected. */
export function convertSyllable(syllable: string, style: ToneStyle = TONE_STYLE): string {
  const chars = Array.from(syllable.normalize('NFC'));
  const parts = chars.map(splitChar);
  const bases = parts.map((p) => p.base.toLowerCase()).join('');
  const toneIndexes = parts.flatMap((p, i) => (p.tone ? [i] : []));
  if (toneIndexes.length !== 1) return syllable.normalize('NFC');
  const n = chars.length;
  if (n < 2) return syllable.normalize('NFC');
  const tail = bases.slice(n - 2);
  if (!PAIR.test(tail)) return syllable.normalize('NFC');
  if (bases.slice(0, n - 2).endsWith('q')) return syllable.normalize('NFC');
  const first = n - 2;
  const second = n - 1;
  const current = toneIndexes[0]!;
  const target = style === 'classic' ? first : second;
  if (current !== first && current !== second) return syllable.normalize('NFC');
  if (current === target) return syllable.normalize('NFC');
  const tone = parts[current]!.tone;
  const out = parts.map((p, i) => {
    if (i === current) return p.base;
    if (i === target) return withTone(p.base, tone);
    return chars[i]!;
  });
  return out.join('');
}

/** NFC + one tone style for a whole text. Non-letters are kept as they are. */
export function normalizeText(text: string, style: ToneStyle = TONE_STYLE): string {
  return text.normalize('NFC').replace(/\p{L}+/gu, (word) => convertSyllable(word, style));
}

/** Words written in the old hyphenated way, e.g. "nhân-dân" (CLAUDE.md §8.5 item 5). */
export function findHyphenated(text: string): string[] {
  return Array.from(text.matchAll(/\p{L}+(?:-\p{L}+)+/gu), (m) => m[0]);
}

/** Turn "nhân-dân" into "nhân dân". Proper names still need a human check for capitals. */
export function modernizeHyphens(text: string): string {
  return text.replace(/(\p{L})-(?=\p{L})/gu, '$1 ');
}

/** True when the text is NFC, uses the chosen style and has no hyphenated words. */
export function isNormalized(text: string, style: ToneStyle = TONE_STYLE): boolean {
  return text === text.normalize('NFC') && normalizeText(text, style) === text && findHyphenated(text).length === 0;
}
