/**
 * CLAUDE.md §8.3. Three countries, three answers. This is not legal advice.
 *
 *   died ≤ 1947 → free in VN, AU, US
 *   1948–1954   → free in VN, AU; US likely protected (not free in VN on 23 Dec 1998)
 *   1955–1975   → free in VN only
 *
 * VN: life + 50 (free from 1 Jan of death year + 51). AU: died before 1955 is free, else life + 70.
 * US: a Vietnamese work is free only if it was already free in Vietnam on 23 Dec 1998 → died ≤ 1947.
 * An unknown or living person (died = null) is treated as protected everywhere.
 */
export type Status = 'free' | 'protected';
export type Flags = { vn: Status; au: Status; us: Status };
export type Person = { name: string; died: number | null; folk?: boolean };

export const US_CUTOFF = 1947;

export function flagsForDeath(died: number | null, year = new Date().getFullYear()): Flags {
  if (died === null) return { vn: 'protected', au: 'protected', us: 'protected' };
  return {
    vn: died <= year - 51 ? 'free' : 'protected',
    au: died < 1955 || died <= year - 71 ? 'free' : 'protected',
    us: died <= US_CUTOFF ? 'free' : 'protected',
  };
}

const FREE: Flags = { vn: 'free', au: 'free', us: 'free' };

/** Combine people: a reading is free in a country only if every author/translator/reteller is. Folk = free. */
export function flagsForPeople(people: Person[], year = new Date().getFullYear()): Flags {
  return people.reduce<Flags>((acc, p) => {
    const f = p.folk ? FREE : flagsForDeath(p.died, year);
    return {
      vn: acc.vn === 'free' && f.vn === 'free' ? 'free' : 'protected',
      au: acc.au === 'free' && f.au === 'free' ? 'free' : 'protected',
      us: acc.us === 'free' && f.us === 'free' ? 'free' : 'protected',
    };
  }, FREE);
}

/** The MVP rule (CLAUDE.md §14 #2): free in all three countries. */
export function safeEverywhere(flags: Flags): boolean {
  return flags.vn === 'free' && flags.au === 'free' && flags.us === 'free';
}

/**
 * Stored flags may be stricter than computed (e.g. Vũ Trọng Phụng, whose VN term was extended),
 * never looser. Returns the countries where stored says free but the rule says protected.
 */
export function looserThanComputed(stored: Flags, computed: Flags): (keyof Flags)[] {
  return (['vn', 'au', 'us'] as const).filter((k) => stored[k] === 'free' && computed[k] === 'protected');
}
