"use client"

import { useState } from "react"
import { X } from "lucide-react"

type Project = {
  id: string
  name: string
  description: string | null
  status: string
  deadline: string | null
}

type Props = {
  project?: Project
  onClose: () => void
  onSaved: (p: Project & { tasks: { id: string; status: string }[] }) => void
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  COMPLETED: "Concluído",
  ARCHIVED: "Arquivado",
}

export function ProjectModal({ project, onClose, onSaved }: Props) {
  const isEditing = !!project
  const [name, setName] = useState(project?.name ?? "")
  const [description, setDescription] = useState(project?.description ?? "")
  const [status, setStatus] = useState(project?.status ?? "ACTIVE")
  const [deadline, setDeadline] = useState(project?.deadline?.slice(0, 10) ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError("Nome obrigatório"); return }
    setSaving(true)
    setError("")
    try {
      const url = isEditing ? `/api/projetos/${project.id}` : "/api/projetos"
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description || null, status, deadline: deadline || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao salvar")
      onSaved(await res.json())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-[var(--radius)] w-full max-w-md" style={{ boxShadow: "var(--shadow)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-medium text-text">{isEditing ? "Editar projeto" : "Novo projeto"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-[var(--radius-sm)] text-text-muted hover:bg-surface-2 transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: App pessoal, Estudos..."
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
              placeholder="Descrição opcional..."
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
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
