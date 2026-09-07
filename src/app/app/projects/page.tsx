import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectsHub } from "@/components/projects-hub";

export const metadata: Metadata = {
  title: "Projetos",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProjectsPage() {
  return (
    <Suspense>
      <ProjectsHub />
    </Suspense>
  );
}
