import { parse, type HTMLElement } from 'node-html-parser';
import { countSyllables } from '../../src/lib/text/syllables';

/**
 * Turns a rendered Quốc văn trích diễm page (vi.wikisource) into pieces in our body format.
 * - One page can hold several numbered poems ("10-13"): each becomes its own piece.
 * - Removes the 1930 edition's footnote markers, "CHÚ THÍCH" notes and other small-print
 *   editorial text (CLAUDE.md §7: never copy textbook notes).
 * - Keeps poem line breaks and stanza breaks; prose stays as paragraphs.
 */
/** Page names on Wikisource: one per piece, except two pages that hold a chain of poems. */
export const QVTD_PAGES = [
  ...Array.from({ length: 139 }, (_, i) => String(i + 1)).filter((n) => !['10', '11', '12', '13', '27', '28'].includes(n)),
  '10-13',
  '27-28',
].map((n) => `Quốc văn trích diễm/${n}`);

export type RawPiece = { number: string; heading: string; kind: 'verse' | 'prose'; body: string };

const HEADING = /^\s*(\d+)\s*\.?\s*—\s*(.+?)\s*$/;

function textOf(el: HTMLElement): string {
  return el.textContent
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ +([,.;:!?)])/g, '$1'); // a removed footnote mark leaves "chữ , chữ"
}

/** Line numbers the scan prints at the end of some poem lines ("…mối dường, 1"). */
function stripLineNumber(line: string): string {
  return line.replace(/\s+\d{1,2}\s*$/, '').trim();
}

export function splitPieces(html: string, pageNumber?: string): RawPiece[] {
  const root = parse(html);
  const out = root.querySelector('.prp-pages-output');
  if (!out) return [];
  for (const sel of ['.pagenum', 'sup', '.reference', '.references', 'ol.references', 'table', '.ws-noexport', 'style']) {
    for (const el of out.querySelectorAll(sel)) el.remove();
  }
  // Small print is the editor's (introductions, notes, commentary): remove it.
  for (const span of out.querySelectorAll('span[style*="font-size"]')) {
    const size = /font-size:\s*(\d+)%/.exec(span.getAttribute('style') ?? '')?.[1];
    if (size && Number(size) < 100) span.remove();
  }
  for (const p of out.querySelectorAll('p')) if (/^\s*CHÚ[- ]?THÍCH/i.test(textOf(p))) p.remove();

  const pieces: RawPiece[] = [];
  let current: RawPiece | null = null;
  let blocks: { kind: 'verse' | 'prose'; text: string }[] = [];
  const finish = () => {
    if (current && blocks.length) {
      const verse = blocks.filter((b) => b.kind === 'verse').length;
      current.kind = verse >= blocks.length / 2 ? 'verse' : 'prose';
      if (current.kind === 'verse') {
        // Prose before or after a poem is the editor's introduction or commentary.
        while (blocks[0]?.kind === 'prose') blocks.shift();
        while (blocks.at(-1)?.kind === 'prose') blocks.pop();
      }
      current.body = blocks.map((b) => b.text).join('\n\n');
      if (current.body.trim()) pieces.push(current);
    }
    blocks = [];
  };

  for (const node of out.childNodes as HTMLElement[]) {
    if (!('tagName' in node) || !node.tagName) continue;
    const tag = node.tagName.toLowerCase();
    const style = node.getAttribute('style') ?? '';
    if (tag === 'div' && style.includes('text-align:center')) {
      // Heading block. A numbered heading starts a new piece; an unnumbered one does too
      // when no piece has started yet (the page's own number is used).
      for (const p of node.querySelectorAll('p')) {
        const text = textOf(p.querySelector('b') ?? p).trim();
        if (!text) continue;
        const m = HEADING.exec(text);
        if (m) {
          finish();
          current = { number: m[1]!, heading: m[2]!, kind: 'verse', body: '' };
        } else if (!current && pageNumber) {
          current = { number: pageNumber, heading: text, kind: 'verse', body: '' };
        }
      }
      continue;
    }
    if (!current) continue;
    if (tag === 'div' && node.classList.contains('poem')) {
      for (const p of node.querySelectorAll('p')) {
        const lines = p.innerHTML
          .split(/<br\s*\/?>/i)
          .map((l) => stripLineNumber(textOf(parse(l))))
          .filter((l, i, arr) => l !== '' || (i > 0 && i < arr.length - 1));
        const text = lines.join('\n').replace(/\n{2,}/g, '\n\n').trim();
        if (text) blocks.push({ kind: 'verse', text });
      }
    } else if (tag === 'p') {
      const text = textOf(node).trim();
      if (text) blocks.push({ kind: 'prose', text });
    }
  }
  finish();
  return pieces;
}

/** Lục bát: lines alternate 6 and 8 syllables. */
export function looksLucBat(body: string): boolean {
  const lines = body.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return false;
  const counts = lines.map(countSyllables);
  const ok = counts.filter((c, i) => (i % 2 === 0 ? c === 6 : c === 8)).length;
  return ok / counts.length >= 0.9;
}

/** "CẢNH CÙNG QUẪN" → "Cảnh cùng quẫn" (only when the heading is all capitals). */
export function sentenceCase(s: string): string {
  if (s !== s.toUpperCase()) return s;
  const lower = s.toLocaleLowerCase('vi');
  return lower.charAt(0).toLocaleUpperCase('vi') + lower.slice(1);
}

/**
 * Old spelling joins syllables with hyphens ("phồn-hoa", "Nguyệt-nga").
 * Common words: hyphen → space. Proper names (capital first letter away from the start of a
 * line or sentence): every syllable gets a capital ("Nguyệt Nga"). Names learned mid-sentence are
 * reused at line starts. Returns the words it could not decide, for a human to check.
 */
export function modernizeSpelling(text: string): { text: string; unsure: string[] } {
  const names = new Map<string, string>();
  const cap = (w: string) => w.charAt(0).toLocaleUpperCase('vi') + w.slice(1);
  const HY = /\p{L}+(?:-\p{L}+)+/gu;
  const isCapital = (w: string) => w.charAt(0) !== w.charAt(0).toLocaleLowerCase('vi');

  // Pass 1: learn proper names from mid-sentence positions.
  for (const line of text.split('\n')) {
    for (const m of line.matchAll(HY)) {
      const before = line.slice(0, m.index).trimEnd();
      const sentenceStart = before === '' || /[.!?:«"“]$/.test(before);
      if (!sentenceStart && isCapital(m[0])) {
        const name = m[0].split('-').map(cap).join(' ');
        names.set(name.toLocaleLowerCase('vi'), name);
      }
    }
  }
  const unsure = new Set<string>();
  const out = text
    .split('\n')
    .map((line) =>
      line.replace(HY, (word, offset: number) => {
        const before = line.slice(0, offset).trimEnd();
        const sentenceStart = before === '' || /[.!?:«"“]$/.test(before);
        const spaced = word.replace(/-/g, ' ');
        const known = names.get(spaced.toLocaleLowerCase('vi'));
        if (known) return known;
        if (!sentenceStart && isCapital(word)) return word.split('-').map(cap).join(' ');
        if (sentenceStart && word.split('-').slice(1).some(isCapital)) return word.split('-').map(cap).join(' ');
        if (sentenceStart && isCapital(word)) unsure.add(spaced);
        return spaced;
      }),
    )
    .join('\n');
  return { text: out, unsure: [...unsure] };
}

/** ASCII slug: "Thoát vòng danh lợi" → "thoat-vong-danh-loi". */
export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
    .replace(/-$/, '');
}
