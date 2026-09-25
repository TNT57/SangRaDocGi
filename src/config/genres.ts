/** Genre is a label on the card, never a tab (CLAUDE.md §6.2). */
export const GENRES = [
  { id: 'truyen', label: 'Truyện' },
  { id: 'tho', label: 'Thơ' },
  { id: 'dan-gian', label: 'Dân gian' },
  { id: 'nghi-luan', label: 'Văn nghị luận' },
] as const;

export type GenreId = (typeof GENRES)[number]['id'];
export const GENRE_IDS = GENRES.map((g) => g.id) as [GenreId, ...GenreId[]];

export function genreLabel(id: GenreId): string {
  return GENRES.find((g) => g.id === id)?.label ?? id;
}

/** How the text is laid out on the reading page. */
export const FORMS = ['prose', 'verse', 'luc-bat'] as const;
export type Form = (typeof FORMS)[number];
