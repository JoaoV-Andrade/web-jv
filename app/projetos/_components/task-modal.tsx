"use client"

import { useState } from "react"
import { X, Plus, Trash2 } from "lucide-react"

export type Subtask = { id: string; title: string; done: boolean }
export type Task = {
  id: string
  title: string
  description: string | null
  status: "TODO" | "IN_PROGRESS" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH"
  deadline: string | null
  position: number
  subtasks: Subtask[]
}

type Props = {
  projectId: string
  task?: Task
  onClose: () => void
  onSaved: (t: Task) => void
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
}

const STATUS_LABELS: Record<string, string> = {
  TODO: "A Fazer",
  IN_PROGRESS: "Em Andamento",
  DONE: "Concluído",
}

export function TaskModal({ projectId, task, onClose, onSaved }: Props) {
  const isEditing = !!task
  const [title, setTitle] = useState(task?.title ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [priority, setPriority] = useState(task?.priority ?? "MEDIUM")
  const [status, setStatus] = useState(task?.status ?? "TODO")
  const [deadline, setDeadline] = useState(task?.deadline?.slice(0, 10) ?? "")
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks ?? [])
  const [newSub, setNewSub] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError("Título obrigatório"); return }
    setSaving(true)
    setError("")
    try {
      let saved: Task
      if (isEditing) {
        const res = await fetch(`/api/projetos/tasks/${task.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), description: description || null, status, priority, deadline: deadline || null }),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao salvar")
        saved = await res.json()
      } else {
        const newSubTitles = subtasks.map((s) => s.title)
        const res = await fetch(`/api/projetos/${projectId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), description: description || null, priority, deadline: deadline || null, subtasks: newSubTitles }),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao salvar")
        saved = await res.json()
      }
      onSaved(saved)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  function addSubtask() {
    if (!newSub.trim()) return
    setSubtasks((prev) => [...prev, { id: `new-${Date.now()}`, title: newSub.trim(), done: false }])
    setNewSub("")
  }

  async function toggleSubtask(sub: Subtask) {
    if (!isEditing || sub.id.startsWith("new-")) return
    const res = await fetch(`/api/projetos/subtasks/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !sub.done }),
    })
    if (res.ok) {
      setSubtasks((prev) => prev.map((s) => (s.id === sub.id ? { ...s, done: !s.done } : s)))
    }
  }

  async function removeSubtask(sub: Subtask) {
    if (isEditing && !sub.id.startsWith("new-")) {
      await fetch(`/api/projetos/subtasks/${sub.id}`, { method: "DELETE" })
    }
    setSubtasks((prev) => prev.filter((s) => s.id !== sub.id))
  }

  async function addSubtaskToExistingTask() {
    if (!newSub.trim() || !isEditing) return
    const res = await fetch(`/api/projetos/tasks/${task.id}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newSub.trim() }),
    })
    if (res.ok) {
      const created: Subtask = await res.json()
      setSubtasks((prev) => [...prev, created])
      setNewSub("")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-[var(--radius)] w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ boxShadow: "var(--shadow)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-medium text-text">{isEditing ? "Editar tarefa" : "Nova tarefa"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-[var(--radius-sm)] text-text-muted hover:bg-surface-2 transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              >
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Prazo</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          {isEditing && (
            <div>
              <label className="block text-xs text-text-muted mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task["status"])}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          )}

          {/* Subtasks */}
          <div>
            <label className="block text-xs text-text-muted mb-2">Subtarefas</label>
            {subtasks.length > 0 && (
              <div className="space-y-1 mb-2">
                {subtasks.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 group">
                    <button
                      type="button"
                      onClick={() => toggleSubtask(s)}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        s.done ? "bg-accent border-accent" : "border-border hover:border-accent"
                      }`}
                    >
                      {s.done && <span className="text-white text-xs leading-none">✓</span>}
                    </button>
                    <span className={`text-sm flex-1 ${s.done ? "line-through text-text-muted" : "text-text"}`}>
                      {s.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(s)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-text-muted hover:text-danger transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); isEditing ? addSubtaskToExistingTask() : addSubtask() }
                }}
                placeholder="Nova subtarefa (Enter)"
                className="flex-1 px-2.5 py-1.5 text-xs bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={isEditing ? addSubtaskToExistingTask : addSubtask}
                className="px-2.5 py-1.5 text-xs bg-surface-2 border border-border rounded-[var(--radius-sm)] text-text-muted hover:text-text transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm text-text-muted border border-border rounded-[var(--radius-sm)] hover:bg-surface-2 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm bg-accent text-white font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover disabled:opacity-50 transition-colors">
              {saving ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
