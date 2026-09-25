import { describe, expect, it } from 'vitest';
import { countSyllables } from '../../src/lib/text/syllables';
import { convertSyllable, findHyphenated, isNormalized, modernizeHyphens, normalizeText } from '../../src/lib/text/tone';
import { parseBody } from '../../src/lib/text/body';
import { displayMinutes, readSeconds } from '../../src/lib/text/readtime';

describe('syllables (§8.4: count tiếng split by spaces)', () => {
  it('counts Vietnamese syllables and ignores punctuation-only tokens', () => {
    expect(countSyllables('Ao thu lạnh lẽo nước trong veo,')).toBe(7);
    expect(countSyllables('Gió theo lối gió — mây đường mây ...')).toBe(7);
  });
  it('ignores footnote markers', () => {
    expect(countSyllables('Sân Lai[^1] cách mấy nắng mưa')).toBe(6);
  });
});

describe('tone style (§8.5 item 5)', () => {
  it('converts modern to classic placement by default', () => {
    expect(convertSyllable('hoà')).toBe('hòa');
    expect(convertSyllable('khoẻ')).toBe('khỏe');
    expect(convertSyllable('thuỷ')).toBe('thủy');
    expect(convertSyllable('Hoà')).toBe('Hòa');
  });
  it('converts classic to modern when asked', () => {
    expect(convertSyllable('hòa', 'modern')).toBe('hoà');
    expect(convertSyllable('tỏa', 'modern')).toBe('toả');
  });
  it('leaves syllables that are the same in both styles', () => {
    for (const s of ['hoàng', 'quý', 'quả', 'huýt', 'thuyền', 'nước', 'Nguyễn']) expect(convertSyllable(s)).toBe(s);
  });
  it('normalises NFD to NFC', () => {
    const nfd = 'Thu điếu'.normalize('NFD');
    expect(normalizeText(nfd)).toBe('Thu điếu');
    expect(isNormalized(nfd)).toBe(false);
  });
  it('finds and fixes old hyphenated spelling', () => {
    expect(findHyphenated('vì nhân-dân và tổ-quốc')).toEqual(['nhân-dân', 'tổ-quốc']);
    expect(modernizeHyphens('vì nhân-dân')).toBe('vì nhân dân');
    expect(isNormalized('vì nhân-dân')).toBe(false);
  });
});

describe('body parser (§7: poems keep line breaks, lục bát indented)', () => {
  it('keeps verse lines and stanzas', () => {
    const p = parseBody('Dòng một\nDòng hai\n\nDòng ba', 'verse');
    expect(p.blocks).toHaveLength(2);
    expect(p.blocks[0]).toMatchObject({ kind: 'stanza' });
    expect((p.blocks[0] as { lines: unknown[] }).lines).toHaveLength(2);
  });
  it('indents 6-syllable lines in lục bát', () => {
    const p = parseBody('Trước lầu Ngưng Bích khóa xuân,\nVẻ non xa tấm trăng gần ở chung.', 'luc-bat');
    const lines = (p.blocks[0] as { lines: { indent: boolean }[] }).lines;
    expect(lines.map((l) => l.indent)).toEqual([true, false]);
  });
  it('joins prose lines into paragraphs and handles scene breaks', () => {
    const p = parseBody('Câu một\ncâu hai.\n\n***\n\nĐoạn sau.', 'prose');
    expect(p.blocks.map((b) => b.kind)).toEqual(['para', 'break', 'para']);
  });
  it('numbers footnotes in order of use and reports problems', () => {
    const p = parseBody('Sân Lai[^lai] và gốc tử[^tu]\n\n[^tu]: cây thị\n[^lai]: tích Lão Lai\n[^x]: thừa', 'verse');
    expect(p.notes).toEqual([
      { key: 'lai', n: 1, text: 'tích Lão Lai' },
      { key: 'tu', n: 2, text: 'cây thị' },
    ]);
    expect(p.errors).toEqual(['Footnote [^x] is defined but never used']);
    expect(p.plainText).not.toContain('[^');
  });
});

describe('read time (§8.4)', () => {
  const speed = { measured: true, proseSyllablesPerMinute: 200, verseSyllablesPerMinute: 100, measuredBy: 'N', measuredOn: '2026-01-01' };
  it('uses the verse speed for verse and lục bát', () => {
    expect(readSeconds(100, 'verse', speed)).toBe(60);
    expect(readSeconds(100, 'luc-bat', speed)).toBe(60);
    expect(readSeconds(100, 'prose', speed)).toBe(30);
  });
  it('shows < 1 minute for very short pieces', () => {
    expect(displayMinutes(20)).toBe(0);
    expect(displayMinutes(40)).toBe(1);
    expect(displayMinutes(250)).toBe(4);
  });
});
