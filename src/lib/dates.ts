const TIME_ZONE = "Asia/Manila";

// The Philippines has no daylight saving time, so this never changes.
const MANILA_OFFSET = "+08:00";

function manilaParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

// Today's date in Manila, as YYYY-MM-DD.
export function todayInManila(): string {
  return manilaParts(new Date()).date;
}

// The current Manila time, formatted for a datetime-local input.
export function nowForDateTimeInput(): string {
  const { date, time } = manilaParts(new Date());
  return `${date}T${time}`;
}

// Converts a datetime-local value (always Manila time) to an exact moment.
export function manilaInputToDate(value: string): Date {
  return new Date(`${value}:00${MANILA_OFFSET}`);
}

// Rejects impossible dates such as 2026-02-31.
export function isRealDate(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
