"use client";

import { Trash2 } from "lucide-react";

export function DeleteButton({ onDelete, label }: { onDelete: () => Promise<void>; label: string }) {
  async function handle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Excluir "${label}"?`)) return;
    await onDelete();
  }
  return (
    <button
      onClick={handle}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
      aria-label={`Excluir ${label}`}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
