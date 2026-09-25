/** CLAUDE.md §6.2 default themes. Every reading has exactly one. */
export const THEMES = [
  { id: 'thien-nhien', label: 'Thiên nhiên' },
  { id: 'dat-nuoc-lich-su', label: 'Đất nước & lịch sử' },
  { id: 'than-phan', label: 'Thân phận con người' },
  { id: 'tieng-cuoi', label: 'Tiếng cười' },
  { id: 'tinh-cam', label: 'Tình cảm' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export const THEME_IDS = THEMES.map((t) => t.id) as [ThemeId, ...ThemeId[]];
/** The "Tất cả" tab. Not a theme a reading can have. */
export const ALL = 'tat-ca' as const;
export type TabId = ThemeId | typeof ALL;

export function themeLabel(id: ThemeId): string {
  return THEMES.find((t) => t.id === id)?.label ?? id;
}
