import type { Metadata } from "next";
import { CalendarView } from "@/components/calendar-view";

export const metadata: Metadata = {
  title: "Calendário",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CalendarPage() {
  return <CalendarView />;
}
