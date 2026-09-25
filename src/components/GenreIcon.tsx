import type { GenreId } from '../config/genres';

/** Simple line icons, drawn for this project. */
export function GenreIcon({ genre }: { genre: GenreId }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' } as const;
  switch (genre) {
    case 'truyen': // open book
      return (
        <svg {...common}>
          <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z" />
          <path d="M12 6.5v13" />
        </svg>
      );
    case 'tho': // quill
      return (
        <svg {...common}>
          <path d="M19.5 4.5c-6 .5-10 4.5-11.5 11L7 19" />
          <path d="M19.5 4.5c.5 6-3.5 10-10 11.5" />
          <path d="M10 12.5 14 9" />
        </svg>
      );
    case 'dan-gian': // nón lá
      return (
        <svg {...common}>
          <path d="M12 4 3 16.5c5 2 13 2 18 0L12 4Z" />
          <path d="M7.5 16.8 9 20M16.5 16.8 15 20" />
        </svg>
      );
    case 'nghi-luan': // scroll
      return (
        <svg {...common}>
          <path d="M7 4h11a2 2 0 0 1 0 4H7" />
          <path d="M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
          <path d="M9 12h6M9 15.5h4" />
        </svg>
      );
  }
}
