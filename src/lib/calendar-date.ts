/** Calendar values are date-only, independent of UTC offsets. Noon avoids DST midnight gaps. */
export function calendarDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year!, month! - 1, day!, 12);
}

export function calendarValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
