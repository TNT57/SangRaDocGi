import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { site } from '../config/site';
import { ALL, THEMES, themeLabel, type TabId, type ThemeId } from '../config/themes';
import { TIERS, tierColor } from '../config/rarity';
import { t } from '../i18n/vi';
import type { CardData } from '../lib/readings';
import { fillerCards, pick, suggestTheme } from '../lib/picker';
import { daysBetween, localDay, recordOpen, remaining as remainingToday, today, type DailyState } from '../lib/daily';
import { loadDaily, loadDay, loadOpened, saveDaily, saveDay, saveOpened } from '../lib/storage';
import { ease, LEAD_CARDS, TAIL_CARDS, offsetAt, positionFor, spinDuration } from '../lib/reel';
import { formatCount, loadCount, reportOpen } from '../lib/counter-client';
import { track } from '../lib/analytics';
import { Card, readingHref } from './Card';

type Result = { card: CardData; repeat: boolean };
type Phase = 'idle' | 'spinning' | 'revealed';

const IDLE_INDEX = 2;

function initialReel(pool: CardData[]): CardData[] {
  if (pool.length === 0) return [];
  return Array.from({ length: 7 }, (_, i) => pool[i % pool.length]!);
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export default function CrateApp({ pool }: { pool: CardData[] }) {
  const [tab, setTab] = useState<TabId>(ALL);
  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const [daily, setDaily] = useState<DailyState | null>(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [reel, setReel] = useState<CardData[]>(() => initialReel(pool));
  const [result, setResult] = useState<Result | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [announce, setAnnounce] = useState('');

  const trackRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const position = useRef(positionFor(IDLE_INDEX, 0.5));
  const centreIndex = useRef(IDLE_INDEX);
  const frame = useRef(0);
  /** Saved at pick time, shown on screen only when the reel stops (no spoilers mid-spin). */
  const pending = useRef<{ opened: Set<string>; daily: DailyState } | null>(null);

  // Load device state, counter and visit analytics once.
  useEffect(() => {
    setOpened(loadOpened());
    setDaily(loadDaily());
    setReady(true);
    void loadCount().then(setCount);

    const day = localDay();
    const first = loadDay('first-visit');
    if (!first) {
      saveDay('first-visit', day);
      saveDay('last-active', day);
      track('first-visit');
    } else if (loadDay('last-active') !== day) {
      saveDay('last-active', day);
      track(`return-d${Math.min(30, daysBetween(first, day))}`);
    }
    return () => cancelAnimationFrame(frame.current);
  }, []);

  const setTrack = (x: number) => {
    position.current = x;
    if (trackRef.current) trackRef.current.style.transform = `translate3d(${x}px,0,0)`;
  };

  const left = remainingToday(daily, site.dailyLimit);
  const inTab = useMemo(() => (tab === ALL ? pool : pool.filter((c) => c.theme === tab)), [pool, tab]);
  const freshInTab = inTab.filter((c) => !opened.has(c.slug)).length;
  const freshInPool = pool.filter((c) => !opened.has(c.slug)).length;
  const exhausted = ready && tab !== ALL && inTab.length > 0 && freshInTab === 0 && freshInPool > 0;
  const suggestion = exhausted ? suggestTheme(pool, opened) : null;
  const todays = useMemo(() => {
    const slugs = [...new Set(today(daily).opens)];
    return slugs.map((s) => pool.find((c) => c.slug === s)).filter((c): c is CardData => !!c);
  }, [daily, pool]);

  function reveal(r: Result) {
    if (pending.current) {
      setOpened(pending.current.opened);
      setDaily(pending.current.daily);
      pending.current = null;
    }
    setPhase('revealed');
    setResult(r);
    setCount((c) => (c === null ? null : c + 1));
    setAnnounce(t.announce(r.card.title, r.card.author, r.card.tier + 1));
    try {
      dialogRef.current?.showModal();
    } catch {
      dialogRef.current?.setAttribute('open', '');
    }
  }

  function open() {
    if (phase === 'spinning' || left <= 0) return;
    const res = pick(pool, tab, opened);
    if (res.kind !== 'reading') return;
    const winner = res.reading;

    // The result is decided and saved before any animation (CLAUDE.md §6.1), so a reload
    // mid-spin cannot give a free crate. The screen only shows it when the reel stops.
    const nextOpened = new Set(opened).add(winner.slug);
    const nextDaily = recordOpen(daily, winner.slug);
    pending.current = { opened: nextOpened, daily: nextDaily };
    saveOpened(nextOpened);
    saveDaily(nextDaily);
    reportOpen();
    track('open');

    // Build the strip: the cards now on screen, then fillers, then the winner, then a few more.
    const keep = reel.slice(Math.max(0, centreIndex.current - IDLE_INDEX), centreIndex.current + 3);
    const source = inTab.length ? inTab : pool;
    const winnerIndex = keep.length + LEAD_CARDS;
    const strip = [...keep, ...fillerCards(source, LEAD_CARDS), winner, ...fillerCards(source, TAIL_CARDS)];
    const startIndex = Math.min(IDLE_INDEX, centreIndex.current);
    const start = positionFor(startIndex, offsetAt(position.current, centreIndex.current));
    const end = positionFor(winnerIndex, Math.random());
    centreIndex.current = winnerIndex;
    position.current = start; // the re-render below draws the new strip at `start`
    setReel(strip);
    setResult(null);
    setAnnounce('');

    if (prefersReducedMotion()) {
      // No animation: show the result directly (CLAUDE.md §6.1).
      requestAnimationFrame(() => {
        setTrack(end);
        reveal({ card: winner, repeat: res.repeat });
      });
      return;
    }

    setPhase('spinning');
    const duration = spinDuration(site.spinMs);
    let started = 0;
    const step = (now: number) => {
      if (!started) {
        started = now;
        setTrack(start);
      }
      const p = Math.min(1, (now - started) / duration);
      setTrack(start + (end - start) * ease(p));
      if (p < 1) frame.current = requestAnimationFrame(step);
      else reveal({ card: winner, repeat: res.repeat });
    };
    frame.current = requestAnimationFrame(step);
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  const spinning = phase === 'spinning';
  const buttonText = spinning ? t.openingButton : phase === 'revealed' || today(daily).opens.length > 0 ? t.openAgainButton : t.openButton;

  const inventory = useMemo(
    () => [...inTab].sort((a, b) => b.tier - a.tier || a.title.localeCompare(b.title, 'vi')),
    [inTab],
  );
  const openedInTab = inTab.filter((c) => opened.has(c.slug)).length;

  if (pool.length === 0) {
    return (
      <>
        <div class="intro-row">
          <div class="intro">
            <h1>{t.siteTagline}</h1>
          </div>
        </div>
        <section class="vault" aria-label={t.crateLabel}>
          <p class="vault-empty">{t.poolEmpty}</p>
        </section>
      </>
    );
  }

  return (
    <>
      <div class="intro-row">
        <div class="intro">
          <h1>{t.siteTagline}</h1>
        </div>
        {count !== null && (
          <p class="counter" data-testid="counter">
            {t.counterLabel}
            <strong>{formatCount(count)}</strong>
          </p>
        )}
      </div>

      <div class="tabs" role="tablist" aria-label={t.themesLabel}>
        {[{ id: ALL, label: t.allTab }, ...THEMES].map((th) => (
          <button
            type="button"
            role="tab"
            class="tab"
            aria-selected={tab === th.id}
            disabled={spinning}
            onClick={() => setTab(th.id as TabId)}
          >
            {th.label}
          </button>
        ))}
      </div>

      <section class="vault" aria-label={t.crateLabel}>
        <div class="reel" aria-hidden="true">
          <div class="centre-line" />
          <div class="reel-track" ref={trackRef} style={{ transform: `translate3d(${position.current}px,0,0)` }}>
            {reel.map((card, i) => (
              <Card key={`${i}-${card.slug}`} card={card} hideFromReaders />
            ))}
          </div>
        </div>

        <div class="controls">
          {exhausted ? (
            <>
              <p class="vault-message" role="status">
                {t.themeExhausted}
              </p>
              {suggestion && (
                <button type="button" class="open-button" onClick={() => setTab(suggestion)}>
                  {t.tryTheme(themeLabel(suggestion as ThemeId))}
                </button>
              )}
            </>
          ) : left <= 0 ? (
            <>
              <button type="button" class="open-button" disabled>
                {t.limitReached}
              </button>
              <a class="link-button" href="#hom-nay">
                {t.seeToday}
              </a>
            </>
          ) : (
            <button type="button" class="open-button" onClick={open} disabled={spinning} aria-busy={spinning}>
              {buttonText} {!spinning && <span class="left">· {t.remaining(left)}</span>}
            </button>
          )}
        </div>
      </section>

      <div class="sr-only" aria-live="polite" role="status">
        {announce}
      </div>

      <dialog
        ref={dialogRef}
        class="result"
        style={result ? { '--r': tierColor(result.card.tier) } : undefined}
        aria-labelledby="result-title"
        onClose={() => setPhase('idle')}
        onClick={(e) => {
          if (e.target === dialogRef.current) closeDialog();
        }}
      >
        {result && (
          <div class="result-inner">
            <span class="result-label">{result.repeat ? t.resultRepeat : t.resultNew}</span>
            <h2 id="result-title" class="sr-only">
              {result.card.title}, {result.card.author}
            </h2>
            <Card card={result.card} />
            {result.card.heavy && <span class="heavy-tag">{t.heavy}</span>}
            <div class="result-actions">
              <a class="read-now" href={readingHref(result.card.slug)}>
                {t.readNow}
              </a>
              <button type="button" class="ghost-button" onClick={closeDialog}>
                {t.continue}
              </button>
            </div>
          </div>
        )}
      </dialog>

      {todays.length > 0 && (
        <section class="section" id="hom-nay" aria-labelledby="today-title">
          <div class="section-head">
            <h2 id="today-title">{t.todayTitle}</h2>
            <span class="progress">{t.remaining(left)}</span>
          </div>
          <ul class="today-list">
            {todays.map((c) => (
              <li>
                <a href={readingHref(c.slug)} style={{ '--r': tierColor(c.tier) }}>
                  <span class="t">{c.title}</span>
                  <span class="a">{c.author}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section class="section" aria-labelledby="inventory-title">
        <div class="section-head">
          <div>
            <p class="eyebrow">{t.inventoryEyebrow}</p>
            <h2 id="inventory-title" class="progress-title">
              {t.inventoryProgress(ready ? openedInTab : 0, inTab.length)}
            </h2>
          </div>
          <div class="legend">
            <span>{t.legendLow}</span>
            <span class="legend-dots" aria-hidden="true">
              {TIERS.map((tier) => (
                <i style={{ background: tier.color }} />
              ))}
            </span>
            <span>{t.legendHigh}</span>
            <span class="sr-only">{t.rarityLegend}</span>
          </div>
        </div>
        <div class="inventory-grid">
          {inventory.map((c) => {
            const isOpen = ready && opened.has(c.slug);
            return <Card key={c.slug} card={c} locked={!isOpen} href={isOpen ? readingHref(c.slug) : undefined} />;
          })}
        </div>
      </section>
    </>
  );
}
