// Makes % and _ in a search match literally in ILIKE patterns.
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function containsPattern(value: string): string {
  return `%${escapeLike(value)}%`;
}
