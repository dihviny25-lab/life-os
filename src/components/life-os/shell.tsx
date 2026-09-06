"use client";

import { useLifeOS } from "@/store/life-os";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { QuickCapture } from "./quick-capture";
import { ItemEditor } from "./item-editor";
import { ItemDetailSheet } from "./item-detail-sheet";
import { CommandPalette } from "./command-palette";
import { ShortcutsHelp } from "./shortcuts-help";
import { NotificationManager } from "./notifications";
import { OnboardingFlow } from "./onboarding-flow";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardView } from "./views/dashboard-view";
import { InboxView } from "./views/inbox-view";
import { CalendarView } from "./views/calendar-view";
import { ProjectsView } from "./views/projects-view";
import { ReviewsView } from "./views/reviews-view";
import { DomainView } from "./views/domain-view";
import { AllItemsView } from "./views/all-items-view";
import { FocusView } from "./views/focus-view";
import { InsightsView } from "./views/insights-view";
import { GraphView } from "./views/graph-view";
import { AgendaView } from "./views/agenda-view";
import { SanctuaryView } from "./views/sanctuary-view";
import { JournalEditorView } from "./views/journal-editor-view";
import { SettingsView } from "./views/settings-view";
import { GoalsView, CentralAIView } from "./views/central-placeholder-view";
import { Icon } from "./icon";
import { useEffect } from "react";

export function Shell() {
  const { view, setQuickCaptureOpen, setCommandOpen, setView } = useLifeOS();
  useEffect(() => {
    let gPressed = false; let gTimer: ReturnType<typeof setTimeout> | null = null;
    function handler(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName || "").toLowerCase(); if (tag === "input" || tag === "textarea") return;
      if (e.key === "/") { e.preventDefault(); document.querySelector<HTMLInputElement>('input[placeholder="Search your brain…"]')?.focus(); return; }
      if (gPressed) { const map: Record<string, any> = { d: "dashboard", i: "inbox", c: "calendar", a: "agenda", p: "projects", g: "graph", r: "reviews", s: "insights" }; const target = map[e.key.toLowerCase()]; if (target) { e.preventDefault(); setView(target); } gPressed = false; if (gTimer) clearTimeout(gTimer); return; }
      if (e.key.toLowerCase() === "g" && !e.metaKey && !e.ctrlKey) { gPressed = true; if (gTimer) clearTimeout(gTimer); gTimer = setTimeout(() => { gPressed = false; }, 800); }
    }
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [setView]);
  useEffect(() => { fetch("/api/scheduler", { method: "POST" }).catch(() => {}); }, []);
  return <div className="flex h-screen overflow-hidden bg-background"><Sidebar /><div className="flex min-w-0 flex-1 flex-col"><Topbar /><main className="flex min-h-0 flex-1 flex-col overflow-y-auto"><div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8"><AnimatePresence mode="wait"><motion.div key={view} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}><ViewSwitcher view={view} /></motion.div></AnimatePresence></div><Footer onQuickCapture={() => setQuickCaptureOpen(true)} onCommand={() => setCommandOpen(true)} /></main></div><QuickCapture /><ItemEditor /><ItemDetailSheet /><CommandPalette /><ShortcutsHelp /><NotificationManager /><OnboardingFlow /></div>;
}

function ViewSwitcher({ view }: { view: string }) {
  if (view === "dashboard") return <DashboardView />; if (view === "inbox") return <InboxView />; if (view === "calendar") return <CalendarView />; if (view === "agenda") return <AgendaView />; if (view === "focus") return <FocusView />; if (view === "projects") return <ProjectsView />; if (view === "goals") return <GoalsView />; if (view === "graph") return <GraphView />; if (view === "central-ai") return <CentralAIView />; if (view === "sanctuary") return <SanctuaryView />; if (view === "journal") return <JournalEditorView />; if (view === "reviews") return <ReviewsView />; if (view === "insights") return <InsightsView />; if (view === "all") return <AllItemsView />; if (view === "settings") return <SettingsView />; return <DomainView domainKey={view} />;
}

function Footer({ onQuickCapture, onCommand }: { onQuickCapture: () => void; onCommand: () => void }) {
  return <footer className="mt-auto border-t border-border/60 bg-background/60 px-4 py-4 backdrop-blur-sm"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row"><div className="flex items-center gap-1.5"><Icon name="Command" className="h-3.5 w-3.5 text-emerald-500" /><span className="font-medium">Central</span><span className="text-muted-foreground/60">·</span><span>Sua central de comando.</span></div><div className="flex items-center gap-3"><button onClick={onCommand} className="hidden items-center gap-1 hover:text-foreground sm:inline-flex"><kbd className="rounded border border-border bg-muted px-1">⌘P</kbd> comando</button><button onClick={onQuickCapture} className="inline-flex items-center gap-1 text-emerald-600 hover:underline dark:text-emerald-400"><Icon name="Zap" className="h-3 w-3" /> Captura rápida</button></div></div></footer>;
}
