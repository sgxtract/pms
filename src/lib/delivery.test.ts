import { describe, expect, it } from "vitest";
import { getDeliveryStatus } from "@/lib/delivery";

const ntp = new Date("2026-10-01T09:00:00+08:00");

describe("getDeliveryStatus()", () => {
  it("is unknown without Calendar Days or a Notice to Proceed", () => {
    expect(
      getDeliveryStatus({
        calendarDays: null,
        noticeToProceedAt: ntp,
        isOpen: true,
      }),
    ).toBeNull();
    expect(
      getDeliveryStatus({
        calendarDays: 30,
        noticeToProceedAt: null,
        isOpen: true,
      }),
    ).toBeNull();
  });

  it("is due Calendar Days after the Notice to Proceed", () => {
    const status = getDeliveryStatus({
      calendarDays: 30,
      noticeToProceedAt: ntp,
      isOpen: true,
    });
    expect(status?.dueAt.toISOString()).toBe(
      new Date("2026-10-31T09:00:00+08:00").toISOString(),
    );
  });

  it("is overdue only after the due date, and only while open", () => {
    const input = { calendarDays: 30, noticeToProceedAt: ntp, isOpen: true };
    expect(
      getDeliveryStatus(input, new Date("2026-10-30T09:00:00+08:00"))
        ?.isOverdue,
    ).toBe(false);
    expect(
      getDeliveryStatus(input, new Date("2026-11-01T09:00:00+08:00"))
        ?.isOverdue,
    ).toBe(true);
    expect(
      getDeliveryStatus(
        { ...input, isOpen: false },
        new Date("2026-11-01T09:00:00+08:00"),
      )?.isOverdue,
    ).toBe(false);
  });
});
