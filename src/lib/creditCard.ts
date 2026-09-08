import { db } from "@/lib/db";

// A purchase made after closingDay belongs to next month's cycle; on or
// before, it belongs to the current month's cycle.
export function closingDateForPurchase(date: Date, closingDay: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), closingDay, 23, 59, 59, 999);
  if (date.getDate() > closingDay) d.setMonth(d.getMonth() + 1);
  return d;
}

// The next occurrence of dueDay strictly after closingDate — handles both a
// due day that falls later in the same month and one that only makes sense
// in the month after (e.g. closes the 25th, due the 5th).
export function dueDateForClosing(closingDate: Date, dueDay: number): Date {
  const d = new Date(closingDate.getFullYear(), closingDate.getMonth(), dueDay);
  if (d <= closingDate) d.setMonth(d.getMonth() + 1);
  return d;
}

const monthLabelFmt = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" });

// Called lazily (dashboard/finance overview reads) instead of on a schedule —
// this app has no background jobs, so "the invoice closes on day X" only
// actually happens the next time something looks. Catches up one cycle at a
// time in case the app wasn't opened for a while, so no cycle is skipped.
export async function materializeDueCreditCardInvoices(userId: string) {
  const now = new Date();
  const cards = await db.creditCard.findMany({ where: { userId, archived: false } });

  for (const card of cards) {
    for (let i = 0; i < 24; i++) {
      const oldest = await db.creditCardPurchase.findFirst({
        where: { cardId: card.id, billId: null },
        orderBy: { date: "asc" },
      });
      if (!oldest) break;

      const closingDate = closingDateForPurchase(oldest.date, card.closingDay);
      if (closingDate > now) break; // this cycle is still open

      const cycleItems = await db.creditCardPurchase.findMany({
        where: { cardId: card.id, billId: null, date: { lte: closingDate } },
      });
      const total = Math.round(cycleItems.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
      const dueDate = dueDateForClosing(closingDate, card.dueDay);

      const bill = await db.bill.create({
        data: {
          userId,
          title: `Fatura ${card.name} — ${monthLabelFmt.format(closingDate)}`,
          amount: total,
          dueDate,
          creditCardId: card.id,
        },
      });
      await db.creditCardPurchase.updateMany({
        where: { id: { in: cycleItems.map((p) => p.id) } },
        data: { billId: bill.id },
      });
    }
  }
}
