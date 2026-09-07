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
  MoreHorizontal,
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

const NAV_ITEMS = [
  { key: "hoje", href: "/app", name: "Hoje", icon: Home, color: "#f59e0b" },
  ...AREAS.map((a) => ({ key: a.key, href: `/app/areas/${a.key}`, name: a.name, icon: AREA_ICONS[a.key] || Home, color: a.color })),
];

const BOTTOM_NAV_KEYS = ["hoje", "financas", "familia", "igreja_ministerio"];
const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter((i) => BOTTOM_NAV_KEYS.includes(i.key));
const MORE_NAV_ITEMS = NAV_ITEMS.filter((i) => !BOTTOM_NAV_KEYS.includes(i.key));

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
      <div className="sticky top-0 z-30 flex w-full items-center border-b border-sidebar-border bg-sidebar/95 px-4 py-3 backdrop-blur-sm md:hidden">
        <span className="font-display text-base font-semibold tracking-tight">Central</span>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-sidebar-border bg-sidebar/95 backdrop-blur-sm md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.key} href={item.href} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]">
              <Icon className="h-5 w-5" style={{ color: active ? item.color : "var(--muted-foreground)" }} />
              <span className={active ? "font-medium text-foreground" : "text-muted-foreground"}>{item.name}</span>
            </Link>
          );
        })}
        <button onClick={() => setMobileOpen(true)} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground">
          <MoreHorizontal className="h-5 w-5" />
          Mais
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/40 md:hidden" />
            <motion.div key="sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-sidebar md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
              <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
                <span className="font-display text-base font-semibold tracking-tight">Mais opções</span>
                <button onClick={() => setMobileOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Fechar menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent items={MORE_NAV_ITEMS} pathname={pathname} email={email} onLogout={handleLogout} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <aside className="relative hidden w-60 shrink-0 overflow-hidden border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-[url('/sidebar-mountains.jpg')] bg-cover bg-center opacity-55" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sidebar via-sidebar/95 to-[#061426]/55" aria-hidden="true" />
        <div className="relative z-10 border-b border-sidebar-border px-5 py-4">
          <span className="font-display text-lg font-semibold tracking-tight">Central</span>
        </div>
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <SidebarContent items={NAV_ITEMS} pathname={pathname} email={email} onLogout={handleLogout} />
        </div>
      </aside>
    </>
  );
}

function SidebarContent({ items, pathname, email, onLogout }: { items: typeof NAV_ITEMS; pathname: string; email: string | null; onLogout: () => void }) {
  return (
    <div className="flex flex-1 flex-col justify-between overflow-y-auto py-4">
      <nav className="space-y-0.5 px-3">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.key} href={item.href} className="relative block">
              {active && <motion.div layoutId="sidebar-active" className="absolute inset-0 rounded-lg bg-sidebar-accent" transition={{ type: "spring", duration: 0.4, bounce: 0.15 }} />}
              <span className={cn("relative z-10 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors", active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <Icon className="h-4 w-4 shrink-0" style={active ? { color: item.color } : undefined} />
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 pt-3">
        {email && <p className="truncate px-3 pb-2 text-xs text-muted-foreground">{email}</p>}
        <button onClick={onLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground">
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}
