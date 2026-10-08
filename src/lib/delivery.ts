const DAY_MS = 24 * 60 * 60 * 1000;

export type DeliveryStatus = { dueAt: Date; isOverdue: boolean } | null;

// Decision 5.6: delivery is due Calendar Days after the Notice to Proceed.
// `isOpen` means the PR is active and not yet Completed.
export function getDeliveryStatus(
  input: {
    calendarDays: number | null;
    noticeToProceedAt: Date | null;
    isOpen: boolean;
  },
  now: Date = new Date(),
): DeliveryStatus {
  if (input.calendarDays === null || input.noticeToProceedAt === null) {
    return null;
  }

  const dueAt = new Date(
    input.noticeToProceedAt.getTime() + input.calendarDays * DAY_MS,
  );
  return { dueAt, isOverdue: input.isOpen && now > dueAt };
}
