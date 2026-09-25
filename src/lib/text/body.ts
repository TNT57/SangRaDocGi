import type { Form } from '../../config/genres';
import { countSyllables } from './syllables';

/**
 * Reading body format (plain text in the .md file, no Markdown features):
 *   - blank line       → new paragraph (prose) or new stanza (verse)
 *   - a line "***"     → scene break
 *   - "[^key]"         → footnote marker; "[^key]: text" on its own line defines it
 * Verse keeps every line break (CLAUDE.md §7). In "luc-bat" form, 6-syllable lines are indented.
 */
export type Inline = { kind: 'text'; text: string } | { kind: 'ref'; key: string; n: number };
export type Line = { inlines: Inline[]; indent: boolean };
export type Block =
  | { kind: 'para'; inlines: Inline[] }
  | { kind: 'stanza'; lines: Line[] }
  | { kind: 'break' };
export type Note = { key: string; n: number; text: string };
export type ParsedBody = { blocks: Block[]; notes: Note[]; errors: string[]; plainText: string };

const DEF = /^\[\^([^\]]+)\]:\s*(.+)$/;
const REF = /\[\^([^\]]+)\]/g;

export function parseBody(body: string, form: Form): ParsedBody {
  const errors: string[] = [];
  const defs = new Map<string, string>();
  const kept: string[] = [];
  for (const raw of body.replace(/\r\n?/g, '\n').split('\n')) {
    const m = DEF.exec(raw.trim());
    if (m) defs.set(m[1]!, m[2]!.trim());
    else kept.push(raw);
  }

  const order = new Map<string, number>();
  const inlines = (text: string): Inline[] => {
    const out: Inline[] = [];
    let last = 0;
    for (const m of text.matchAll(REF)) {
      const key = m[1]!;
      if (m.index! > last) out.push({ kind: 'text', text: text.slice(last, m.index) });
      if (!order.has(key)) order.set(key, order.size + 1);
      out.push({ kind: 'ref', key, n: order.get(key)! });
      last = m.index! + m[0].length;
    }
    if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
    return out;
  };

  const groups: string[][] = [];
  let current: string[] = [];
  for (const raw of kept) {
    const line = raw.trim();
    if (line === '') {
      if (current.length) groups.push(current), (current = []);
    } else if (line === '***') {
      if (current.length) groups.push(current), (current = []);
      groups.push(['***']);
    } else current.push(line);
  }
  if (current.length) groups.push(current);

  const blocks: Block[] = groups.map((group) => {
    if (group.length === 1 && group[0] === '***') return { kind: 'break' };
    if (form === 'prose') return { kind: 'para', inlines: inlines(group.join(' ')) };
    return {
      kind: 'stanza',
      lines: group.map((line) => ({
        inlines: inlines(line),
        indent: form === 'luc-bat' && countSyllables(line) === 6,
      })),
    };
  });

  for (const key of order.keys()) if (!defs.has(key)) errors.push(`Footnote [^${key}] has no definition`);
  for (const key of defs.keys()) if (!order.has(key)) errors.push(`Footnote [^${key}] is defined but never used`);

  const notes = [...order.entries()].map(([key, n]) => ({ key, n, text: defs.get(key) ?? '' }));
  const plainText = kept.join('\n').replace(REF, '').replace(/^\*\*\*$/gm, '');
  return { blocks, notes, errors, plainText };
}
