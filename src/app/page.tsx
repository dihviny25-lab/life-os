import Link from "next/link";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center text-foreground">
      <h1 className="text-4xl font-bold tracking-tight">{siteConfig.name}</h1>
      <p className="max-w-md text-muted-foreground">{siteConfig.description}</p>
      <Link href="/login">
        <Button size="lg">Entrar</Button>
      </Link>
    </div>
  );
}
