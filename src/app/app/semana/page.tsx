import type { Metadata } from "next";
import { WeekReport } from "@/components/week-report";

export const metadata: Metadata = {
  title: "Progresso da semana",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WeekReportPage() {
  return <WeekReport />;
}
