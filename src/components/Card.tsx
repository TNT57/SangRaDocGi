import type { CSSProperties } from 'preact';
import { tierColor } from '../config/rarity';
import { t } from '../i18n/vi';
import type { CardData } from '../lib/readings';
import { GenreIcon } from './GenreIcon';

/**
 * CLAUDE.md §6.6. One text-only card used in the reel, the popup and the inventory:
 * title, author, rarity colour (border + glow), theme label, genre icon, read time.
 * The tier is never named; screen readers get "độ hiếm n/5".
 */
export function Card({
  card,
  href,
  locked = false,
  hideFromReaders = false,
  style,
}: {
  card: CardData;
  href?: string;
  locked?: boolean;
  hideFromReaders?: boolean;
  style?: CSSProperties;
}) {
  const content = (
    <>
      <div class="card-top">
        <GenreIcon genre={card.genre} />
        <span>{card.genreLabel}</span>
        <span class="card-time">{t.readTime(card.minutes)}</span>
      </div>
      <p class="card-title">{card.title}</p>
      <p class="card-author">{card.author}</p>
      <div class="card-theme">
        <span>{card.themeLabel}</span>
        {card.draft && <span class="card-draft" aria-hidden="true">NHÁP</span>}
      </div>
      <span class="sr-only">
        , {t.rarityHidden(card.tier + 1)}
        {locked ? `, ${t.notOpened}` : ''}
      </span>
    </>
  );
  const props = {
    class: `card${locked ? ' is-locked' : ''}`,
    style: { '--r': tierColor(card.tier), ...style } as CSSProperties,
    'data-slug': card.slug,
    'data-tier': String(card.tier),
    'aria-hidden': hideFromReaders ? ('true' as const) : undefined,
  };
  return href ? (
    <a {...props} href={href}>
      {content}
    </a>
  ) : (
    <div {...props} aria-disabled={locked ? 'true' : undefined}>
      {content}
    </div>
  );
}

export function readingHref(slug: string): string {
  return `/bai/${slug}`;
}
