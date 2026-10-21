// Months with no PRs still appear as zero rows, so the trend has no gaps.
export function monthsBetween(first: string, last: string): string[] {
  const months: string[] = [];
  let [year, month] = first.split("-").map(Number);
  const [lastYear, lastMonth] = last.split("-").map(Number);
  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

export function fillMonths<T extends { month: string }>(
  rows: T[],
  range: { from: string | null; to: string | null },
  today: string, // YYYY-MM-DD
  empty: (month: string) => T,
): T[] {
  if (rows.length === 0) return [];
  const firstRow = rows[0].month;
  const lastRow = rows[rows.length - 1].month;
  const first = range.from?.slice(0, 7) ?? firstRow;
  // Stop at the current month: "This year" shouldn't list Nov and Dec as zero in October.
  const rangeEnd = range.to?.slice(0, 7) ?? lastRow;
  const capped = rangeEnd < today.slice(0, 7) ? rangeEnd : today.slice(0, 7);
  const last = capped > lastRow ? capped : lastRow;
  const byMonth = new Map(rows.map((row) => [row.month, row]));
  return monthsBetween(first, last).map(
    (month) => byMonth.get(month) ?? empty(month),
  );
}
