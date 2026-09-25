import { parse } from 'node-html-parser';
/**
 * Turn Wikisource wikitext into our plain body format (src/lib/text/body.ts).
 * Prefers the text inside <poem> tags when present. Removes templates, refs, links markup,
 * bold/italic quotes, HTML tags and categories. The result still needs a human proofread.
 */
export function cleanWikitext(wikitext: string): string {
  let text = wikitext.replace(/\r\n?/g, '\n');
  const poems = [...text.matchAll(/<poem[^>]*>([\s\S]*?)<\/poem>/gi)].map((m) => m[1]!);
  if (poems.length) text = poems.join('\n\n');

  text = text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n');

  // Nested templates: remove innermost first until none are left.
  let previous = '';
  while (previous !== text) {
    previous = text;
    text = text.replace(/\{\{[^{}]*\}\}/g, '');
  }

  text = text
    .replace(/\[\[(?:Thể loại|Category|Tập tin|File|Hình):[^\]]*\]\]/gi, '')
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/\[https?:\/\/\S+\s([^\]]*)\]/g, '$1')
    .replace(/'''''|'''|''/g, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/^[:;*#]+\s*/gm, '')
    .replace(/^=+\s*(.*?)\s*=+$/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text;
}

/** Line-by-line comparison to help proofreading: returns lines that differ. */
export function diffLines(a: string, b: string): { line: number; ours: string; theirs: string }[] {
  const x = a.trim().split('\n');
  const y = b.trim().split('\n');
  const out: { line: number; ours: string; theirs: string }[] = [];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const ours = (x[i] ?? '').trim();
    const theirs = (y[i] ?? '').trim();
    if (ours !== theirs) out.push({ line: i + 1, ours, theirs });
  }
  return out;
}

/**
 * Preferred path: read the text from the rendered page (keeps words that sit inside templates,
 * e.g. alternative-wording markers). Takes every poem block; if there is none, the paragraphs
 * before the first section heading. Footnote marks and the page header are dropped.
 */
export function extractFromHtml(html: string): string {
  const root = parse(html);
  for (const sel of ['#headerContainer', '.ws-noexport', 'sup', '.reference', '.references', '.mw-references-wrap', 'style', 'table', '.pagenum']) {
    for (const el of root.querySelectorAll(sel)) el.remove();
  }
  const clean = (s: string) => s.replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/ +([,.;:!?)])/g, '$1').trim();
  const poems = root.querySelectorAll('div.poem p');
  if (poems.length) {
    return poems
      .map((p) => p.innerHTML.split(/<br\s*\/?>/i).map((l) => clean(parse(l).textContent)).join('\n').trim())
      .filter(Boolean)
      .join('\n\n');
  }
  const out: string[] = [];
  const container = root.querySelector('.mw-parser-output') ?? root;
  for (const node of container.childNodes) {
    const el = node as unknown as { tagName?: string; classList?: { contains(c: string): boolean }; textContent: string };
    if (!el.tagName) continue;
    if (el.classList?.contains('mw-heading') || /^H[1-6]$/.test(el.tagName)) break;
    if (el.tagName === 'P') {
      const text = clean(el.textContent);
      if (text) out.push(text);
    }
  }
  return out.join('\n\n');
}
