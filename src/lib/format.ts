const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

/** Tanggal kalender (YYYY-MM-DD) tanpa pergeseran zona waktu. */
export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? "Tanggal tidak valid" : dateFormatter.format(date);
}

export function formatDateRange(from: string, to: string): string {
  return from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`;
}

/** Waktu dengan zona eksplisit (WIB). */
export function formatDateTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return Number.isNaN(date.getTime()) ? "Waktu tidak valid" : `${dateTimeFormatter.format(date)} WIB`;
}

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
const monthYearFormatter = new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric", timeZone: "UTC" });
const integerFormatter = new Intl.NumberFormat("id-ID");

/** Tanggal ringkas untuk sumbu grafik, mis. "17 Agu". */
export function formatShortDate(isoDate: string): string {
  return shortDateFormatter.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

/** Bulan dan tahun, mis. "Agu 2019". */
export function formatMonthYear(isoDate: string): string {
  return monthYearFormatter.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

export function formatCount(value: number): string {
  return integerFormatter.format(value);
}

/** Angka desimal format Indonesia dengan tanda minus tipografis, mis. "−0,85". */
export function formatDecimal(value: number, digits = 2): string {
  const text = new Intl.NumberFormat("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(value));
  const rounded = Number(value.toFixed(digits));
  return rounded < 0 ? `−${text}` : text;
}

/** Muka air tanah dalam meter, mis. "−0,85 m". */
export function formatMeters(value: number, digits = 2): string {
  return `${formatDecimal(value, digits)} m`;
}

/** Penjelasan awam muka air tanah, mis. "85 cm di bawah permukaan". */
export function describeDepth(value: number): string {
  const cm = Math.round(Math.abs(value) * 100);
  if (cm === 0) return "Setara permukaan tanah";
  return value < 0 ? `${integerFormatter.format(cm)} cm di bawah permukaan` : `${integerFormatter.format(cm)} cm di atas permukaan (tergenang)`;
}

/** Besar perubahan dalam sentimeter tanpa tanda, mis. "12 cm". */
export function formatCentimeters(value: number): string {
  return `${integerFormatter.format(Math.round(Math.abs(value) * 100))} cm`;
}

const utcDateTimeFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

/** Waktu satelit dalam UTC, untuk dicocokkan dengan sumber FIRMS. */
export function formatUtcDateTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return Number.isNaN(date.getTime()) ? "Waktu tidak valid" : `${utcDateTimeFormatter.format(date)} UTC`;
}
