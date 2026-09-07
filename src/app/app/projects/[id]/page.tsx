import type { Metadata } from "next";
import { ProjectDetail } from "@/components/project-detail";

export const metadata: Metadata = {
  title: "Projeto",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
