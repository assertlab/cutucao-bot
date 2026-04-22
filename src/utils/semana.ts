function dateInTimezone(date: Date, timezone: string): { y: number; m: number; d: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

export function isoWeekOfDate(utcDate: Date): string {
  const d = new Date(
    Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function currentIsoWeek(timezone: string, now: Date = new Date()): string {
  const { y, m, d } = dateInTimezone(now, timezone);
  return isoWeekOfDate(new Date(Date.UTC(y, m - 1, d)));
}

export function isoWeekMonday(isoWeek: string): Date {
  const match = /^(\d{4})-W(\d{2})$/.exec(isoWeek);
  if (!match) throw new Error(`ISO week inválida: ${isoWeek}`);
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return monday;
}

export function diffInWeeks(earlier: string, later: string): number {
  const a = isoWeekMonday(earlier).getTime();
  const b = isoWeekMonday(later).getTime();
  return Math.round((b - a) / (7 * 86400000));
}

export function isoWeekOffset(isoWeek: string, weeks: number): string {
  const monday = isoWeekMonday(isoWeek);
  monday.setUTCDate(monday.getUTCDate() + weeks * 7);
  return isoWeekOfDate(monday);
}

export function formatWeekRange(isoWeek: string): { inicio: string; fim: string } {
  const monday = isoWeekMonday(isoWeek);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (d: Date) =>
    `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return { inicio: fmt(monday), fim: fmt(sunday) };
}

export function formatDateBr(date: Date, timezone: string): string {
  const { y, m, d } = dateInTimezone(date, timezone);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}
