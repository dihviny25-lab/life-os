import type { Metadata } from "next";
import { AdjustmentPlan } from "@/components/adjustment-plan";

export const metadata: Metadata = {
  title: "Plano de ajuste",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdjustmentPlanPage() {
  return <AdjustmentPlan />;
}

