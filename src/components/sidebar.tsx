"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  Users,
  Wallet,
  Scissors,
  Code2,
  Church,
  User,
  BookOpen,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { notify } from "@/lib/toast";
import { AREAS } from "@/lib/areas";
import { cn } from "@/lib/utils";

const AREA_ICONS: Record<string, typeof Users> = {
  familia: Users,
  financas: Wallet,
  barbearia: Scissors,
  desenvolvimento: Code2,
  igreja_ministerio: Church,
  pessoal: User,
  conhecimento: BookOpen,
};

const NAV_ITEMS = [{ key: "hoje", href: "/app", name: "Hoje", icon: Home }, ...AREAS.map((a) => ({ key: a.key, href: `/app/areas/${a.key}`, name: a.name, icon: AREA_ICONS[a.key] || Home }))];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated) router.replace("/login");
        else setEmail(d.email);
      });
  }, [router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    notify.success("Sessão encerrada");
    router.replace("/login");
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm md:hidden">
        <span className="text-sm font-bold tracking-tight">Central</span>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
            />
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-background md:hidden"
            >
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <span className="text-sm font-bold tracking-tight">Central</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent pathname={pathname} email={email} onLogout={handleLogout} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-background md:flex md:flex-col">
        <div className="border-b border-border/60 px-5 py-4">
          <span className="text-base font-bold tracking-tight">Central</span>
        </div>
        <SidebarContent pathname={pathname} email={email} onLogout={handleLogout} />
      </aside>
    </>
  );
}

function SidebarContent({
  pathname,
  email,
  onLogout,
}: {
  pathname: string;
  email: string | null;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-between overflow-y-auto py-4">
      <nav className="space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.key} href={item.href} className="relative block">
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-muted"
                  transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 px-3 pt-3">
        {email && <p className="truncate px-3 pb-2 text-xs text-muted-foreground">{email}</p>}
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}
