import type { Metadata } from "next";
import { Shell } from "@/components/life-os/shell";

export const metadata: Metadata = {
  title: "Painel",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppPage() {
  return <Shell />;
}
