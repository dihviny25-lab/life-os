"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Icon } from "./icon";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; desc: string; icon: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Global",
    shortcuts: [
      { keys: ["⌘", "K"], desc: "Captura rápida para a entrada", icon: "Zap" },
      { keys: ["⌘", "P"], desc: "Abrir Paleta de Comandos", icon: "Command" },
      { keys: ["/"], desc: "Focar a barra de pesquisa", icon: "Search" },
      { keys: ["?"], desc: "Mostrar essa folha de atalhos", icon: "Keyboard" },
    ],
  },
  {
    title: "Captura Rápida",
    shortcuts: [
      { keys: ["Enter"], desc: "Capturar para a entrada", icon: "Inbox" },
      { keys: ["⌘", "Enter"], desc: "Criar como item ativo", icon: "PlusCircle" },
      { keys: ["Shift", "Enter"], desc: "Nova linha no texto", icon: "CornerDownLeft" },
      { keys: ["Esc"], desc: "Fechar diálogo", icon: "X" },
      { keys: ["1–6"], desc: "Mudar tipo de item", icon: "ListFilter" },
    ],
  },
  {
    title: "Navegação",
    shortcuts: [
      { keys: ["G", "D"], desc: "Ir para o Painel", icon: "LayoutDashboard" },
      { keys: ["G", "I"], desc: "Ir para a Entrada", icon: "Inbox" },
      { keys: ["G", "C"], desc: "Ir para o Calendário", icon: "CalendarDays" },
      { keys: ["G", "A"], desc: "Ir para a Agenda", icon: "CalendarRange" },
      { keys: ["G", "F"], desc: "Ir para o timer de Foco", icon: "Brain" },
      { keys: ["G", "P"], desc: "Ir para Projetos", icon: "FolderKanban" },
      { keys: ["G", "G"], desc: "Ir para o Grafo Mental", icon: "Network" },
      { keys: ["G", "R"], desc: "Ir para Revisões", icon: "NotebookPen" },
      { keys: ["G", "S"], desc: "Ir para Insights", icon: "TrendingUp" },
    ],
  },
];

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const inField = tag === "input" || tag === "textarea";
      if (e.key === "?" && !inField) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Keyboard" className="h-5 w-5 text-violet-500" />
            Atalhos de Teclado
          </DialogTitle>
          <DialogDescription>Navegue pelo seu Life OS na velocidade do pensamento.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.title}
              </h3>
              <div className="grid gap-1">
                {group.shortcuts.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 odd:bg-muted/30"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <Icon name={s.icon} className="h-3.5 w-3.5 text-muted-foreground" />
                      {s.desc}
                    </span>
                    <span className="flex items-center gap-1">
                      {s.keys.map((k, j) => (
                        <kbd
                          key={j}
                          className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
