import type { Metadata } from "next";
import { MonthReport } from "@/components/month-report";

export const metadata: Metadata = {
  title: "Relatório mensal",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MonthReportPage() {
  return <MonthReport />;
}
