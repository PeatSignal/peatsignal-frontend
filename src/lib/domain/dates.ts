const DAY_MS = 86_400_000;

/** Parse YYYY-MM-DD sebagai tengah malam UTC. */
export function parseIsoDate(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year ?? NaN, (month ?? NaN) - 1, day ?? NaN);
}

export function toIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  return toIsoDate(parseIsoDate(isoDate) + days * DAY_MS);
}

/** Jumlah hari dari `from` ke `to` (to - from). */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseIsoDate(to) - parseIsoDate(from)) / DAY_MS);
}

/** Tanggal kalender UTC dari timestamp ISO. */
export function isoDateOf(dateTime: string): string {
  return new Date(dateTime).toISOString().slice(0, 10);
}

/** Akhir hari `as_of` (UTC) sebagai batas eksklusif informasi masa depan. */
export function endOfDayMs(isoDate: string): number {
  return parseIsoDate(isoDate) + DAY_MS - 1;
}

export function isWithinDates(isoDate: string, from: string, to: string): boolean {
  return isoDate >= from && isoDate <= to;
}

export function clampDate(isoDate: string, min: string, max: string): string {
  if (isoDate < min) return min;
  if (isoDate > max) return max;
  return isoDate;
}
