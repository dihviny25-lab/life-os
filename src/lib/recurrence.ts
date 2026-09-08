// Recurring commitments don't get new rows created — the stored startAt is
// an anchor, and we project it forward to the next real occurrence at read time.

export function nextOccurrence(anchor: Date, recurring: string | null | undefined, from: Date): Date {
  if (!recurring) return anchor;

  const d = new Date(anchor);
  if (recurring === "monthly") {
    while (d < from) d.setMonth(d.getMonth() + 1);
    return d;
  }

  const stepDays = recurring === "daily" || recurring === "weekdays" ? 1 : recurring === "weekly" ? 7 : null;
  if (!stepDays) return anchor;

  while (d < from) {
    d.setDate(d.getDate() + stepDays);
    if (recurring === "weekdays") {
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    }
  }
  return d;
}

export function projectCommitment<T extends { startAt: Date; recurring?: string | null }>(c: T, from: Date): T {
  if (!c.recurring) return c;
  return { ...c, startAt: nextOccurrence(c.startAt, c.recurring, from) };
}

// A calendar grid needs every occurrence inside a range, not just the next
// one — a recurring commitment repeats across the whole month/week shown.
export function occurrencesInRange(c: { startAt: Date; recurring?: string | null }, rangeStart: Date, rangeEnd: Date): Date[] {
  if (!c.recurring) {
    return c.startAt >= rangeStart && c.startAt <= rangeEnd ? [c.startAt] : [];
  }

  const dates: Date[] = [];
  let d = nextOccurrence(c.startAt, c.recurring, rangeStart);
  let guard = 0;
  while (d <= rangeEnd && guard < 400) {
    dates.push(new Date(d));
    guard++;
    if (c.recurring === "monthly") {
      d.setMonth(d.getMonth() + 1);
    } else {
      const stepDays = c.recurring === "weekly" ? 7 : 1;
      d.setDate(d.getDate() + stepDays);
      if (c.recurring === "weekdays") {
        while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
      }
    }
  }
  return dates;
}
