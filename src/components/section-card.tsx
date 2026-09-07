"use client";

import type { LucideIcon } from "lucide-react";

export function SectionCard({
  title,
  icon: Icon,
  color = "#71717a",
  actions,
  children,
}: {
  title: string;
  icon: LucideIcon;
  color?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(38,33,23,0.04)]"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${color}1a`, color }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <h2 className="font-display text-[15px] font-semibold tracking-tight">{title}</h2>
        </div>
        {actions}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
