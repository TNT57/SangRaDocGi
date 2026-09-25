/**
 * Poems (CLAUDE.md §7): keep every line on one row so lines stay aligned.
 * If the longest line is wider than the text column, shrink the poem just enough,
 * never below MIN_PX (only reached on small phones). Without JavaScript a very long
 * line may wrap instead.
 */
export const MIN_PX = 15;

export function fitVerse(body: HTMLElement): void {
  const lines = [...body.querySelectorAll<HTMLElement>('.verse-line')];
  if (!lines.length || body.clientWidth === 0) return;
  body.style.removeProperty('--verse-size');
  body.classList.add('is-measuring');
  // Where the text of each line really ends, measured from the left edge of the column.
  const left = body.getBoundingClientRect().left;
  const range = document.createRange();
  const widest = Math.max(
    ...lines.map((l) => {
      range.selectNodeContents(l);
      return range.getBoundingClientRect().right - left;
    }),
  );
  body.classList.remove('is-measuring');
  const available = body.clientWidth;
  const base = parseFloat(getComputedStyle(body).fontSize);
  if (widest <= available) return;
  const size = Math.max(MIN_PX, Math.floor(base * (available / widest) * 0.98 * 10) / 10);
  body.style.setProperty('--verse-size', `${size / base}em`);
}

/** Fit now, after web fonts load, and on resize. */
export function keepVerseFitted(getBody: () => HTMLElement | null): void {
  const run = () => {
    const body = getBody();
    if (body) fitVerse(body);
  };
  run();
  void document.fonts?.ready.then(run);
  let timer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(run, 100);
  });
}
