"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { Task } from "@/lib/types";

export function ProjectTasks({ projectId, tasks, onChange }: { projectId: string; tasks: Task[]; onChange: () => void }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  async function toggle(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    onChange();
  }

  async function submit() {
    if (!title.trim()) {
      setAdding(false);
      return;
    }
    await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    setTitle("");
    setAdding(false);
    onChange();
  }

  return (
    <div className="mt-1.5 space-y-1">
      {tasks.map((t) => (
        <label key={t.id} className="flex items-center gap-2 text-xs">
          <Checkbox checked={t.done} onCheckedChange={() => toggle(t)} className="h-3.5 w-3.5" />
          <span className={t.done ? "text-muted-foreground line-through" : "text-muted-foreground"}>{t.title}</span>
        </label>
      ))}
      {adding ? (
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Nova tarefa…"
          className="h-6 text-xs"
        />
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <Plus className="h-3 w-3" /> Tarefa
        </button>
      )}
    </div>
  );
}
