"use client";

import { useItems } from "@/lib/hooks";
import { useLifeOS } from "@/store/life-os";
import { Icon } from "./icon";
import { motion } from "framer-motion";
import { fmtDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

const RELATIONSHIP_CADENCE: Record<string, number> = {
  "amigo próximo": 14,
  amigo: 30,
  família: 14,
  mentor: 45,
  colega: 60,
  conhecido: 90,
};
const DEFAULT_CADENCE = 45;

export function FollowUpDue() {
  const { data } = useItems({ type: "contact", status: "active,done" });
  const { openItemDetail, openItemEditor } = useLifeOS();

  const contacts = (data?.items || [])
    .map((c: any) => {
      const lastContact = c.metadata?.lastContact ? new Date(c.metadata.lastContact) : null;
      const cadence = RELATIONSHIP_CADENCE[c.metadata?.relationship?.toLowerCase()] || DEFAULT_CADENCE;
      const daysSince = lastContact ? Math.floor((Date.now() - lastContact.getTime()) / 86400000) : 999;
      const overdue = daysSince >= cadence;
      const dueIn = cadence - daysSince;
      return { ...c, lastContact, cadence, daysSince, overdue, dueIn };
    })
    .sort((a: any, b: any) => b.daysSince - a.daysSince);

  const dueContacts = contacts.filter((c: any) => c.overdue);
  const upcoming = contacts.filter((c: any) => !c.overdue).slice(0, 2);

  if (contacts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-600">
            <Icon name="Users" className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-semibold">Mantenha contato</h3>
        </div>
        <p className="text-xs text-muted-foreground">Adicione contatos pra receber lembretes gentis de quando é hora de falar com eles.</p>
        <button
          onClick={() => openItemEditor({ type: "contact" })}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-cyan-600 hover:underline"
        >
          <Icon name="Plus" className="h-3 w-3" /> Adicionar contato
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-600">
            <Icon name="Users" className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Reconectar</h3>
            <p className="text-[10px] text-muted-foreground">
              {dueContacts.length > 0
                ? `${dueContacts.length} ${dueContacts.length === 1 ? "pessoa" : "pessoas"} pra falar`
                : "Você está em dia"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {dueContacts.slice(0, 4).map((c: any, i: number) => {
          const urgency = c.daysSince > c.cadence * 2 ? "high" : "med";
          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => openItemDetail(c.id)}
              className="group flex w-full items-center gap-2.5 rounded-lg border border-border/40 bg-background/60 p-2.5 text-left transition-all hover:border-cyan-500/30 hover:bg-background"
            >
              <div
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  urgency === "high" ? "bg-rose-500/15 text-rose-500" : "bg-amber-500/15 text-amber-600",
                )}
              >
                {c.title.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{c.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {c.metadata?.relationship || "contato"} · há {c.daysSince}d
                </p>
              </div>
              <span
                className={cn(
                  "flex-shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase",
                  urgency === "high" ? "bg-rose-500/15 text-rose-500" : "bg-amber-500/15 text-amber-600",
                )}
              >
                {c.daysSince > c.cadence * 2 ? "Atrasado" : "Pendente"}
              </span>
            </motion.button>
          );
        })}

        {upcoming.map((c: any, i: number) => (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (dueContacts.length + i) * 0.05 }}
            onClick={() => openItemDetail(c.id)}
            className="group flex w-full items-center gap-2.5 rounded-lg p-2.5 text-left transition-all hover:bg-muted/40"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
              {c.title.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{c.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {c.metadata?.relationship || "contato"} · em {c.dueIn}d
              </p>
            </div>
            <Icon name="Clock" className="h-3 w-3 text-muted-foreground/50" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
