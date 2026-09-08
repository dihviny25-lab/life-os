"use client";

import { useEffect, useState, useCallback } from "react";
import { BookOpen, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SectionCard } from "@/components/section-card";
import { DeleteButton } from "@/components/delete-button";
import { notify } from "@/lib/toast";

interface MediaItem {
  id: string;
  kind: "livro" | "filme_serie";
  title: string;
  status: "proximo" | "andamento" | "concluido";
}

const STATUS_GROUPS: { status: MediaItem["status"]; livroLabel: string; filmeLabel: string }[] = [
  { status: "andamento", livroLabel: "Lendo", filmeLabel: "Assistindo" },
  { status: "proximo", livroLabel: "Próximos", filmeLabel: "Próximos" },
  { status: "concluido", livroLabel: "Lidos", filmeLabel: "Assistidos" },
];

export function MediaLists() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/media");
    const json = await res.json();
    setItems(json.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return null;

  return (
    <div className="space-y-5">
      <MediaCard kind="livro" title="Livros" icon={BookOpen} color="#14b8a6" items={items.filter((i) => i.kind === "livro")} onChange={load} />
      <MediaCard kind="filme_serie" title="Filmes e Séries" icon={Film} color="#ec4899" items={items.filter((i) => i.kind === "filme_serie")} onChange={load} />
    </div>
  );
}

function MediaCard({
  kind,
  title,
  icon,
  color,
  items,
  onChange,
}: {
  kind: MediaItem["kind"];
  title: string;
  icon: React.ComponentProps<typeof SectionCard>["icon"];
  color: string;
  items: MediaItem[];
  onChange: () => void;
}) {
  async function setStatus(id: string, status: MediaItem["status"]) {
    await fetch(`/api/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onChange();
  }

  async function remove(id: string) {
    await fetch(`/api/media/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <SectionCard title={title} icon={icon} color={color} actions={<AddMediaDialog kind={kind} onAdded={onChange} />}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>
      ) : (
        <div className="space-y-4">
          {STATUS_GROUPS.map((g) => {
            const group = items.filter((i) => i.status === g.status);
            if (group.length === 0) return null;
            const label = kind === "livro" ? g.livroLabel : g.filmeLabel;
            return (
              <div key={g.status}>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
                <ul className="space-y-1.5">
                  {group.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                      <span className="flex-1 font-medium">{item.title}</span>
                      <Select value={item.status} onValueChange={(v) => setStatus(item.id, v as MediaItem["status"])}>
                        <SelectTrigger className="h-7 w-[130px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="proximo">Próximo</SelectItem>
                          <SelectItem value="andamento">{kind === "livro" ? "Lendo" : "Assistindo"}</SelectItem>
                          <SelectItem value="concluido">{kind === "livro" ? "Lido" : "Assistido"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <DeleteButton label={item.title} onDelete={() => remove(item.id)} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function AddMediaDialog({ kind, onAdded }: { kind: MediaItem["kind"]; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<MediaItem["status"]>("proximo");

  async function submit() {
    if (!title) {
      notify.error("Preencha o título");
      return;
    }
    await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, title, status }),
    });
    setOpen(false);
    setTitle("");
    setStatus("proximo");
    onAdded();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          + Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kind === "livro" ? "Novo livro" : "Novo filme/série"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "livro" ? "Ex: Confissão de Fé de Westminster" : "Ex: The Bear"} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as MediaItem["status"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proximo">Próximo</SelectItem>
                <SelectItem value="andamento">{kind === "livro" ? "Lendo" : "Assistindo"}</SelectItem>
                <SelectItem value="concluido">{kind === "livro" ? "Lido" : "Assistido"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
