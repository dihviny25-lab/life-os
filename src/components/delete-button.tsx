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
      className="shrink-0 text-muted-foreground/60 transition-colors hover:text-rose-500"
      aria-label={`Excluir ${label}`}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
