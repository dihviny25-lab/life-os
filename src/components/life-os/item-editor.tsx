"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLifeOS } from "@/store/life-os";
import { useCreateItem, useUpdateItem, useProjects, useDomains, useTags } from "@/lib/hooks";
import { ITEM_TYPES, DOMAINS, PRIORITY_META, ITEM_TYPE_MAP } from "@/lib/constants";
import { Icon } from "./icon";
import { notify } from "@/lib/toast";
import { toDateInput, fromDateInput } from "@/lib/dates";
import { useQueryClient } from "@tanstack/react-query";

export function ItemEditor() {
  const { itemEditorOpen, itemEditorSeed, closeItemEditor } = useLifeOS();
  const create = useCreateItem();
  const update = useUpdateItem();
  const { data: projData } = useProjects();
  const { data: domData } = useDomains();
  const { data: tagData } = useTags();
  const qc = useQueryClient();

  const projects = projData?.projects || [];
  const domains = domData?.domains || [];
  const tags = tagData?.tags || [];

  const [form, setForm] = useState<any>({});
  const [tagInput, setTagInput] = useState("");
  const [lastKey, setLastKey] = useState("");
  const key = itemEditorOpen ? `open:${itemEditorSeed?.id || "new"}` : "closed";
  if (key !== lastKey) {
    setLastKey(key);
    if (itemEditorOpen) {
      setForm({
        type: "task",
        title: "",
        content: "",
        status: "active",
        priority: 0,
        domainId: "",
        projectId: "",
        dueDate: "",
        scheduledAt: "",
        metadata: {},
        tagNames: [],
        ...(itemEditorSeed || {}),
      });
      setTagInput("");
    }
  }

  function set(k: string, v: any) {
    setForm((f: any) => ({ ...f, [k]: v }));
  }
  function setMeta(k: string, v: any) {
    setForm((f: any) => ({ ...f, metadata: { ...f.metadata, [k]: v } }));
  }
  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tagNames.includes(t)) {
      set("tagNames", [...form.tagNames, t]);
    }
    setTagInput("");
  }

  async function save() {
    if (!form.title?.trim()) {
      notify.error("O título é obrigatório");
      return;
    }
    const payload: any = {
      type: form.type,
      title: form.title.trim(),
      content: form.content || undefined,
      status: form.status,
      priority: Number(form.priority) || 0,
      domainId: form.domainId || null,
      projectId: form.projectId || null,
      dueDate: fromDateInput(form.dueDate),
      scheduledAt: fromDateInput(form.scheduledAt),
      tagNames: form.tagNames,
    };
    // type-specific metadata
    if (form.type === "finance" && form.metadata.amount) {
      payload.metadata = { ...form.metadata, amount: Number(form.metadata.amount) };
    } else if (form.type === "habit") {
      payload.metadata = { ...form.metadata, target: Number(form.metadata.target) || 1 };
    } else if (form.type === "bookmark") {
      payload.metadata = {
        ...form.metadata,
        currentPage: form.metadata.currentPage ? Number(form.metadata.currentPage) : undefined,
        totalPages: form.metadata.totalPages ? Number(form.metadata.totalPages) : undefined,
        rating: Number(form.metadata.rating) || 0,
      };
    } else if (form.type === "contact") {
      payload.metadata = { ...form.metadata };
    } else if (form.type === "symptom") {
      payload.metadata = { ...form.metadata, severity: Number(form.metadata.severity) || 1 };
    } else if (form.type === "medication") {
      payload.metadata = { ...form.metadata };
    } else if (form.type === "affirmation" || form.type === "vision") {
      // no extra metadata
    } else if (Object.keys(form.metadata || {}).length) {
      payload.metadata = form.metadata;
    }

    try {
      if (form.id) {
        await update.mutateAsync({ id: form.id, ...payload });
        notify.success("Atualizado");
      } else {
        await create.mutateAsync(payload);
        notify.success("Criado");
      }
      closeItemEditor();
    } catch (e: any) {
      notify.error(e.message || "Falha ao salvar");
    }
  }

  const typeMeta = ITEM_TYPE_MAP[form.type] || ITEM_TYPES[0];
  const isFinance = form.type === "finance";
  const isHabit = form.type === "habit";
  const isBookmark = form.type === "bookmark";
  const isContact = form.type === "contact";
  const isSymptom = form.type === "symptom";
  const isMedication = form.type === "medication";

  // type-specific hint text
  const typeHints: Record<string, string> = {
    task: "O que precisa ser feito?",
    note: "Capture um pensamento ou referência",
    journal: "O que está passando pela sua cabeça agora?",
    habit: "O que você quer fazer regularmente?",
    event: "O que vai acontecer e quando?",
    finance: "Registre receita, despesa ou uma meta de economia",
    contact: "Alguém na sua vida",
    idea: "Uma faísca que vale a pena guardar",
    goal: "Um resultado que você está buscando",
    bookmark: "Um livro, artigo ou mídia para revisitar",
    symptom: "Registre como você está se sentindo fisicamente",
    medication: "Um suplemento ou prescrição",
    affirmation: "Uma frase para repetir para si mesmo",
    vision: "Uma imagem do seu futuro",
    milestone: "Um marco importante",
    routine: "Uma sequência repetível",
    document: "Um arquivo ou registro importante",
  };

  return (
    <Dialog open={itemEditorOpen} onOpenChange={(o) => !o && closeItemEditor()}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[580px]">
        {/* ── Gradient header ── */}
        <div
          className="flex-shrink-0 px-6 pb-4 pt-5"
          style={{ background: `linear-gradient(135deg, ${typeMeta.color}18, transparent 80%)` }}
        >
          <DialogHeader className="space-y-0 p-0">
            <DialogTitle className="flex items-center gap-2.5 text-base font-semibold">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm"
                style={{ background: `${typeMeta.color}22`, color: typeMeta.color }}
              >
                <Icon name={typeMeta.icon} className="h-4.5 w-4.5" />
              </span>
              {form.id ? "Editar item" : "Novo item"}
            </DialogTitle>
            <DialogDescription className="mt-1 pl-[46px] text-xs">
              {typeHints[form.type] || "Crie ou refine um item no seu cérebro digital."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ── Scrollable body ── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-5">
            {/* Type selector — horizontal chip grid */}
            <div>
              <SectionLabel icon="Tag">Tipo</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {ITEM_TYPES.map((t) => {
                  const on = form.type === t.type;
                  return (
                    <button
                      key={t.type}
                      onClick={() => set("type", t.type)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                        on ? "border-transparent text-white shadow-sm" : "border-border/60 text-muted-foreground hover:bg-muted/50"
                      }`}
                      style={on ? { background: t.color } : {}}
                    >
                      <Icon name={t.icon} className="h-3 w-3" />
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <SectionLabel icon="Type">Título</SectionLabel>
              <Input
                autoFocus
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder={typeHints[form.type] || "No que você está pensando?"}
                className="h-10 text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
                }}
              />
            </div>

            {/* Section: Organization */}
            <div>
              <SectionLabel icon="FolderTree">Organização</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.domainId || "none"} onValueChange={(v) => set("domainId", v === "none" ? "" : v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Sem domínio" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="none">Sem domínio</SelectItem>
                    {DOMAINS.map((d) => (
                      <SelectItem key={d.key} value={domains.find((dd: any) => dd.key === d.key)?.id || d.key}>
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                          {d.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={form.projectId || "none"} onValueChange={(v) => set("projectId", v === "none" ? "" : v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Sem projeto" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="none">Sem projeto</SelectItem>
                    {projects.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section: Status & Priority */}
            <div>
              <SectionLabel icon="SlidersHorizontal">Status & Prioridade</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbox">📥 Entrada</SelectItem>
                    <SelectItem value="active">✓ Ativo</SelectItem>
                    <SelectItem value="done">✓ Concluído</SelectItem>
                    <SelectItem value="snoozed">⏰ Adiado</SelectItem>
                    <SelectItem value="archived">📦 Arquivado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={String(form.priority)} onValueChange={(v) => set("priority", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_META.map((p) => (
                      <SelectItem key={p.value} value={String(p.value)}>
                        <span className="inline-flex items-center gap-1.5">
                          {p.value > 0 && <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />}
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section: Timing */}
            {(typeMeta.hasDate || form.type === "task" || form.type === "finance" || form.type === "event" || form.type === "journal") && (
              <div>
                <SectionLabel icon="CalendarClock">Prazos</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input type="datetime-local" value={toDateInput(form.dueDate)} onChange={(e) => set("dueDate", e.target.value)} className="h-9" />
                    <p className="mt-1 text-[10px] text-muted-foreground">Data de vencimento</p>
                  </div>
                  <div>
                    <Input type="datetime-local" value={toDateInput(form.scheduledAt)} onChange={(e) => set("scheduledAt", e.target.value)} className="h-9" />
                    <p className="mt-1 text-[10px] text-muted-foreground">Agendado / registrado em</p>
                  </div>
                </div>
              </div>
            )}

            {/* Type-specific metadata */}
            {isFinance && (
              <MetadataSection icon="Wallet" label="Detalhes financeiros" color={typeMeta.color}>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Tipo</FieldLabel>
                    <Select value={form.metadata.kind || "expense"} onValueChange={(v) => setMeta("kind", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Despesa</SelectItem>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="goal">Meta de economia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Valor (R$)</FieldLabel>
                    <Input type="number" step="0.01" value={form.metadata.amount || ""} onChange={(e) => setMeta("amount", e.target.value)} className="h-9" placeholder="0.00" />
                  </div>
                  {form.metadata.kind !== "goal" && (
                    <div className="col-span-2">
                      <FieldLabel>Recorrência</FieldLabel>
                      <Select value={form.metadata.recurring || "one-time"} onValueChange={(v) => setMeta("recurring", v)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one-time">Única vez</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </MetadataSection>
            )}

            {isHabit && (
              <MetadataSection icon="Repeat" label="Configuração do hábito" color={typeMeta.color}>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <FieldLabel>Frequência</FieldLabel>
                    <Select value={form.metadata.cadence || "daily"} onValueChange={(v) => setMeta("cadence", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="weekdays">Dias úteis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Meta</FieldLabel>
                    <Input type="number" value={form.metadata.target || ""} onChange={(e) => setMeta("target", e.target.value)} className="h-9" placeholder="1" />
                  </div>
                  <div>
                    <FieldLabel>Unidade</FieldLabel>
                    <Input value={form.metadata.unit || ""} onChange={(e) => setMeta("unit", e.target.value)} className="h-9" placeholder="min" />
                  </div>
                </div>
              </MetadataSection>
            )}

            {isBookmark && (
              <MetadataSection icon="Bookmark" label={form.metadata?.medium === "book" ? "Detalhes do livro" : form.metadata?.medium === "movie" || form.metadata?.medium === "video" ? "Lista para assistir" : "Detalhes da mídia"} color={typeMeta.color}>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Mídia</FieldLabel>
                    <Select value={form.metadata.medium || "book"} onValueChange={(v) => setMeta("medium", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="book">Livro</SelectItem>
                        <SelectItem value="article">Artigo</SelectItem>
                        <SelectItem value="course">Curso</SelectItem>
                        <SelectItem value="movie">Filme</SelectItem>
                        <SelectItem value="video">Vídeo</SelectItem>
                        <SelectItem value="podcast">Podcast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Autor / Criador</FieldLabel>
                    <Input value={form.metadata.author || ""} onChange={(e) => setMeta("author", e.target.value)} className="h-9" placeholder="Nome…" />
                  </div>
                  <div className="col-span-2">
                    <FieldLabel>URL</FieldLabel>
                    <Input value={form.metadata.url || ""} onChange={(e) => setMeta("url", e.target.value)} className="h-9" placeholder="https://…" />
                  </div>

                  {/* Reading progress for books */}
                  {form.metadata?.medium === "book" && (
                    <>
                      <div>
                        <FieldLabel>Página atual</FieldLabel>
                        <Input
                          type="number"
                          min={0}
                          value={form.metadata.currentPage || ""}
                          onChange={(e) => setMeta("currentPage", Number(e.target.value) || 0)}
                          className="h-9"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <FieldLabel>Total de páginas</FieldLabel>
                        <Input
                          type="number"
                          min={1}
                          value={form.metadata.totalPages || ""}
                          onChange={(e) => setMeta("totalPages", Number(e.target.value) || 0)}
                          className="h-9"
                          placeholder="ex: 320"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <FieldLabel>Status</FieldLabel>
                    <Select value={form.metadata.status || "queued"} onValueChange={(v) => setMeta("status", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="queued">{form.metadata?.medium === "movie" || form.metadata?.medium === "video" ? "Quero assistir" : "Na fila"}</SelectItem>
                        <SelectItem value="reading">{form.metadata?.medium === "book" ? "Lendo" : form.metadata?.medium === "movie" || form.metadata?.medium === "video" ? "Assistindo" : "Em andamento"}</SelectItem>
                        <SelectItem value="finished">{form.metadata?.medium === "movie" || form.metadata?.medium === "video" ? "Assistido" : "Finalizado"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Avaliação</FieldLabel>
                    <Select value={String(form.metadata.rating || 0)} onValueChange={(v) => setMeta("rating", Number(v))}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((r) => (
                          <SelectItem key={r} value={String(r)}>{r === 0 ? "Sem avaliação" : `${r} ★`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </MetadataSection>
            )}

            {isContact && (
              <MetadataSection icon="User" label="Detalhes do contato" color={typeMeta.color}>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Relacionamento</FieldLabel>
                    <Input value={form.metadata.relationship || ""} onChange={(e) => setMeta("relationship", e.target.value)} className="h-9" placeholder="amigo, mentor…" />
                  </div>
                  <div>
                    <FieldLabel>Aniversário</FieldLabel>
                    <Input type="date" value={form.metadata.birthday ? form.metadata.birthday.slice(0, 10) : ""} onChange={(e) => setMeta("birthday", e.target.value)} className="h-9" />
                  </div>
                </div>
              </MetadataSection>
            )}

            {isSymptom && (
              <MetadataSection icon="Thermometer" label="Detalhes do sintoma" color={typeMeta.color}>
                <div>
                  <FieldLabel>Gravidade (1-5)</FieldLabel>
                  <Input type="number" min={1} max={5} value={form.metadata.severity || ""} onChange={(e) => setMeta("severity", e.target.value)} className="h-9" />
                </div>
              </MetadataSection>
            )}

            {isMedication && (
              <MetadataSection icon="Pill" label="Detalhes do medicamento" color={typeMeta.color}>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Dose</FieldLabel>
                    <Input value={form.metadata.dose || ""} onChange={(e) => setMeta("dose", e.target.value)} className="h-9" placeholder="100mg" />
                  </div>
                  <div>
                    <FieldLabel>Frequência</FieldLabel>
                    <Input value={form.metadata.frequency || ""} onChange={(e) => setMeta("frequency", e.target.value)} className="h-9" placeholder="diária" />
                  </div>
                </div>
              </MetadataSection>
            )}

            {/* Section: Notes */}
            <div>
              <SectionLabel icon="FileText">Notas</SectionLabel>
              <Textarea
                rows={4}
                value={form.content || ""}
                onChange={(e) => set("content", e.target.value)}
                placeholder="Adicione detalhes… (Markdown suportado)"
                className="resize-none"
              />
            </div>

            {/* Section: Tags */}
            <div>
              <SectionLabel icon="Tags">Tags</SectionLabel>
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-border/60 bg-background p-2">
                {form.tagNames?.map((t: string) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                    #{t}
                    <button onClick={() => set("tagNames", form.tagNames.filter((x: string) => x !== t))} className="text-muted-foreground transition-colors hover:text-rose-500">
                      <Icon name="X" className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  list="tag-suggestions"
                  placeholder="adicionar tag…"
                  className="min-w-[80px] flex-1 bg-transparent text-xs outline-none"
                />
                <datalist id="tag-suggestions">
                  {tags.map((t: any) => (
                    <option key={t.id} value={t.name} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sticky footer ── */}
        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border/60 bg-background/95 px-6 py-3 backdrop-blur-md">
          <Button variant="ghost" onClick={closeItemEditor} className="h-9">Cancelar</Button>
          <Button
            onClick={save}
            disabled={create.isPending || update.isPending}
            className="h-9 gap-1.5"
            style={{ background: typeMeta.color, color: "white" }}
          >
            <Icon name={form.id ? "Save" : "Plus"} className="h-3.5 w-3.5" />
            {form.id ? "Salvar alterações" : "Criar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Helper components ──
function SectionLabel({ children, icon }: { children: React.ReactNode; icon: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon name={icon} className="h-3 w-3" />
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">{children}</p>;
}

function MetadataSection({ icon, label, color, children }: { icon: string; label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: `${color}30`, background: `${color}08` }}>
      <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
        <Icon name={icon} className="h-3 w-3" />
        {label}
      </div>
      {children}
    </div>
  );
}
