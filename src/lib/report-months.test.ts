import { describe, expect, it } from "vitest";
import { fillMonths, monthsBetween } from "./report-months";

describe("monthsBetween", () => {
  it("crosses a year boundary", () => {
    expect(monthsBetween("2025-11", "2026-02")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });
});

describe("fillMonths", () => {
  const empty = (month: string) => ({ month, n: 0 });

  it("fills gaps and stops at the current month", () => {
    const rows = [
      { month: "2026-01", n: 2 },
      { month: "2026-03", n: 1 },
    ];
    const result = fillMonths(
      rows,
      { from: "2026-01-01", to: "2026-12-31" },
      "2026-04-15",
      empty,
    );
    expect(result.map((r) => r.month)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
    ]);
    expect(result[1].n).toBe(0);
  });

  it("returns nothing when there are no PRs", () => {
    expect(
      fillMonths([], { from: null, to: null }, "2026-10-21", empty),
    ).toEqual([]);
  });
});
