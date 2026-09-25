/** Site-wide settings. Values Nathan must set before launch are marked TODO. */
export const site = {
  name: 'Két Sách',
  /** CLAUDE.md §3: 10 crates per device per local day. */
  dailyLimit: 10,
  /** CLAUDE.md §8.3: removal requests go here. TODO(Nathan): set a real address before launch. */
  contactEmail: 'TODO@example.com',
  /** Spin length in ms (CLAUDE.md §6.1: ~5 s). */
  spinMs: 5000,
} as const;

export const CONTACT_EMAIL_PLACEHOLDER = 'TODO@example.com';
