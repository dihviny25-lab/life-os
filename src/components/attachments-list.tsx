"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Paperclip, FileText, Image as ImageIcon } from "lucide-react";
import { DeleteButton } from "@/components/delete-button";
import { notify } from "@/lib/toast";

interface AttachmentRow {
  id: string;
  fileName: string;
  url: string;
  contentType: string | null;
  size: number | null;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB — generous for receipts/photos, keeps uploads fast
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsList({ items, projectId, onChange }: { items: AttachmentRow[]; projectId: string; onChange: () => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      notify.error("Só imagens (jpg, png, webp, heic) ou PDF");
      return;
    }
    if (file.size > MAX_SIZE) {
      notify.error("Arquivo muito grande (máx. 10MB)");
      return;
    }
    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: `/api/projects/${projectId}/attachments/upload`,
      });
      await fetch(`/api/projects/${projectId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: blob.url,
          pathname: blob.pathname,
          fileName: file.name,
          contentType: blob.contentType,
          size: file.size,
        }),
      });
      onChange();
    } catch {
      notify.error("Não deu pra enviar o arquivo");
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div className="space-y-1.5">
      {items.length === 0 && !uploading && <p className="text-sm text-muted-foreground">Nenhum arquivo ainda.</p>}
      {items.map((a) => (
        <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
          <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-primary hover:underline">
            {a.contentType?.startsWith("image/") ? <ImageIcon className="h-3.5 w-3.5 shrink-0" /> : <FileText className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">{a.fileName}</span>
            {a.size != null && <span className="shrink-0 text-xs text-muted-foreground">({formatSize(a.size)})</span>}
          </a>
          <DeleteButton label={a.fileName} onDelete={() => remove(a.id)} />
        </div>
      ))}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        <Paperclip className="h-3.5 w-3.5" /> {uploading ? "Enviando…" : "Anexar arquivo"}
      </button>
    </div>
  );
}
