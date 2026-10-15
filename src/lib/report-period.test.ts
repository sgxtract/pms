import { describe, expect, it } from "vitest";
import { resolvePeriod, type ReportParams } from "@/lib/report-period";

const params = (overrides: Partial<ReportParams>): ReportParams => ({
  period: "this_year",
  from: undefined,
  to: undefined,
  ...overrides,
});

describe("resolvePeriod()", () => {
  const today = "2026-10-15";

  it("has no range for all time", () => {
    expect(resolvePeriod(params({ period: "all" }), today)).toMatchObject({
      from: null,
      to: null,
    });
  });

  it("covers the whole current month", () => {
    expect(
      resolvePeriod(params({ period: "this_month" }), today),
    ).toMatchObject({
      from: "2026-10-01",
      to: "2026-10-31",
    });
  });

  it("covers the whole previous month", () => {
    expect(
      resolvePeriod(params({ period: "last_month" }), today),
    ).toMatchObject({
      from: "2026-09-01",
      to: "2026-09-30",
    });
  });

  it("goes back to December of the previous year in January", () => {
    expect(
      resolvePeriod(params({ period: "last_month" }), "2027-01-10"),
    ).toMatchObject({
      from: "2026-12-01",
      to: "2026-12-31",
    });
  });

  it("knows February in a leap year", () => {
    expect(
      resolvePeriod(params({ period: "this_month" }), "2028-02-10"),
    ).toMatchObject({
      from: "2028-02-01",
      to: "2028-02-29",
    });
  });

  it("covers the current quarter", () => {
    expect(
      resolvePeriod(params({ period: "this_quarter" }), today),
    ).toMatchObject({
      from: "2026-10-01",
      to: "2026-12-31",
    });
    expect(
      resolvePeriod(params({ period: "this_quarter" }), "2026-02-20"),
    ).toMatchObject({
      from: "2026-01-01",
      to: "2026-03-31",
    });
  });

  it("covers the current year", () => {
    expect(resolvePeriod(params({ period: "this_year" }), today)).toMatchObject(
      {
        from: "2026-01-01",
        to: "2026-12-31",
      },
    );
  });

  it("uses a valid custom range as given", () => {
    expect(
      resolvePeriod(
        params({ period: "custom", from: "2026-03-01", to: "2026-06-30" }),
        today,
      ),
    ).toMatchObject({ key: "custom", from: "2026-03-01", to: "2026-06-30" });
  });

  it("falls back to all time, with a notice, for an incomplete or reversed range", () => {
    const missing = resolvePeriod(
      params({ period: "custom", from: "2026-03-01" }),
      today,
    );
    expect(missing.key).toBe("all");
    expect(missing.notice).toBeDefined();

    const reversed = resolvePeriod(
      params({ period: "custom", from: "2026-06-30", to: "2026-03-01" }),
      today,
    );
    expect(reversed.key).toBe("all");
    expect(reversed.notice).toBeDefined();
  });
});
