/**
 * Every UI string lives here (CLAUDE.md §11), so English can be added later
 * by adding a sibling file with the same keys.
 */
export const vi = {
  siteTagline: 'Mỗi két, một áng văn đọc dưới 10 phút.',
  siteDescription: 'Mở két, nhận một áng văn Việt ngắn, đọc dưới 10 phút. Tối đa 10 két mỗi ngày.',

  // Crate
  crateLabel: 'Két bài đọc',
  openButton: 'KHAI MỞ KÉT',
  openAgainButton: 'KHAI MỞ LẦN NỮA',
  openingButton: 'ĐANG MỞ KHÓA...',
  remaining: (n: number) => `Còn ${n} lượt`,
  limitReached: 'Mai mở tiếp',
  seeToday: 'Xem các bài đã mở hôm nay',
  themeExhausted: 'Bạn đã mở hết chủ đề này.',
  tryTheme: (label: string) => `Thử chủ đề “${label}”`,
  poolEmpty: 'Kho đang được chuẩn bị. Quay lại sớm nhé.',

  // Result popup
  resultNew: 'ĐÃ KHAI MỞ',
  resultRepeat: 'Đã mở trước đây',
  readNow: 'Đọc ngay',
  continue: 'Tiếp tục',
  heavy: 'Nội dung nặng',
  announce: (title: string, author: string, tier: number) =>
    `Bạn mở được: ${title}, ${author}. Độ hiếm ${tier}/5.`,

  // Card
  rarityHidden: (tier: number) => `độ hiếm ${tier}/5`,
  readTime: (minutes: number) => (minutes < 1 ? '< 1 phút' : `~${minutes} phút`),
  notOpened: 'Chưa mở',

  // Tabs
  allTab: 'Tất cả',
  themesLabel: 'Chủ đề',

  // Counter
  counterLabel: 'Lượt khai mở',

  // Today
  todayTitle: 'Đã mở hôm nay',

  // Inventory
  inventoryEyebrow: 'Trong kho có gì?',
  inventoryProgress: (x: number, y: number) => `Đã mở ${x} / ${y}`,
  rarityLegend: 'Màu viền cho biết tác phẩm nổi tiếng đến đâu',
  legendLow: 'quen',
  legendHigh: 'nổi tiếng nhất',

  // Reading page
  backToCrate: '← Về két',
  source: 'Nguồn',
  sourcesPage: 'Nguồn & bản quyền',
  translator: 'Dịch',
  reteller: 'Kể lại',
  footnotes: 'Chú thích',
  endMark: 'Hết',
  draftBanner: 'BẢN NHÁP — chưa đối chiếu, chưa duyệt. Không được xuất bản.',
  folk: 'Dân gian',

  // Footer / misc
  footerNote: 'Văn bản thuộc phạm vi công cộng. Không dùng cookie.',
  notFoundTitle: 'Không tìm thấy trang',
  notFoundBody: 'Trang này không có trong kho.',
} as const;

export type Strings = typeof vi;
export const t = vi;
