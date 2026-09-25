import { describe, expect, it } from 'vitest';
import { cleanWikitext, diffLines } from '../../scripts/lib/wikitext';
import { joinFrontmatter, splitFrontmatter } from '../../scripts/lib/files';

describe('wikitext cleaning', () => {
  it('keeps poem lines and drops templates, refs and markup', () => {
    const wiki = `{{header|title=Thu điếu|author=Nguyễn Khuyến}}
<poem>
Ao thu lạnh lẽo nước trong veo,<ref>chú thích</ref>
Một chiếc thuyền câu bé ''tẻo teo''.

[[Sóng biếc|Sóng biếc]] theo làn hơi gợn tí,
</poem>
[[Thể loại:Thơ]]`;
    expect(cleanWikitext(wiki)).toBe('Ao thu lạnh lẽo nước trong veo,\nMột chiếc thuyền câu bé tẻo teo.\n\nSóng biếc theo làn hơi gợn tí,');
  });
  it('handles nested templates and <br>', () => {
    expect(cleanWikitext('Dòng một<br/>Dòng {{a|{{b}}}}hai')).toBe('Dòng một\nDòng hai');
  });
  it('lists differing lines for proofreading', () => {
    expect(diffLines('a\nb\nc', 'a\nB\nc\nd')).toEqual([
      { line: 2, ours: 'b', theirs: 'B' },
      { line: 4, ours: '', theirs: 'd' },
    ]);
  });
});

describe('front matter round trip', () => {
  it('splits and joins without losing data', () => {
    const text = '---\ntitle: Thu điếu\nheavy: null\n---\nAo thu\n';
    const { frontmatter, body } = splitFrontmatter(text);
    expect(frontmatter).toEqual({ title: 'Thu điếu', heavy: null });
    expect(joinFrontmatter(frontmatter, body)).toBe(text);
  });
});
