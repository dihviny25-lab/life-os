// Deterministic "random" pick: same verse all day, changes daily, no state to store.
export function verseOfDayIndex(date: Date, count: number): number {
  const dayNumber = Math.floor(date.getTime() / 86400000);
  const scrambled = Math.abs((dayNumber * 2654435761) % 2147483647);
  return scrambled % count;
}
