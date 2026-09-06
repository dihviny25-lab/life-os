"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";

export function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) router.replace("/login");
        else setEmail(data.email);
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    notify.success("Sessão encerrada");
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
      <h1 className="text-2xl font-bold">Bem-vindo{email ? `, ${email}` : ""}!</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Esse é o novo começo do app. Ainda não tem nada aqui — vamos construir juntos a partir da próxima etapa.
      </p>
      <Button variant="outline" onClick={handleLogout}>
        Sair
      </Button>
    </div>
  );
}
