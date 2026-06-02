"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProjectModal } from "./_components/project-modal"
import { Plus, Pencil, Trash2, FolderKanban } from "lucide-react"
import Link from "next/link"

type Task = { id: string; status: string }
type Project = {
  id: string
  name: string
  description: string | null
  status: string
  deadline: string | null
  tasks: Task[]
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  COMPLETED: "Concluído",
  ARCHIVED: "Arquivado",
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-accent-soft text-accent",
  PAUSED: "bg-surface-2 text-text-muted",
  COMPLETED: "bg-success/10 text-success",
  ARCHIVED: "bg-surface-2 text-text-muted",
}

const fmtDate = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/")

export default function ProjetosPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  useEffect(() => {
    fetch("/api/projetos")
      .then((r) => r.json())
      .then((data) => { setProjects(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm("Excluir este projeto e todas as suas tarefas?")) return
    await fetch(`/api/projetos/${id}`, { method: "DELETE" })
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  function handleSaved(p: Project) {
    setProjects((prev) => {
      const exists = prev.find((x) => x.id === p.id)
      return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev]
    })
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <AppShell>
      <div className="max-w-5xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl text-text">Projetos</h1>
          <button
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-accent text-white font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover transition-colors"
          >
            <Plus size={14} /> Novo projeto
          </button>
        </div>

        {/* Project grid */}
        {loading ? (
          <p className="text-text-muted text-sm">Carregando...</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <FolderKanban size={40} className="text-border mx-auto mb-3" />
            <p className="text-text-muted text-sm mb-3">Nenhum projeto ainda.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="text-sm text-accent hover:text-accent-hover"
            >
              + Criar primeiro projeto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => {
              const done = p.tasks.filter((t) => t.status === "DONE").length
              const total = p.tasks.length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <div
                  key={p.id}
                  className="bg-surface border border-border rounded-[var(--radius)] p-5 flex flex-col gap-3 hover:bg-surface-2 transition-colors group"
                  style={{ boxShadow: "var(--shadow)" }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/projetos/${p.id}`} className="flex-1 min-w-0">
                      <h2 className="font-medium text-text truncate hover:text-accent transition-colors">
                        {p.name}
                      </h2>
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${STATUS_COLORS[p.status] ?? ""}`}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </div>

                  {/* Description */}
                  {p.description && (
                    <p className="text-xs text-text-muted line-clamp-2">{p.description}</p>
                  )}

                  {/* Progress */}
                  {total > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-text-muted mb-1">
                        <span>{done}/{total} tarefas</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-1">
                    <div className="flex items-center gap-3">
                      {p.deadline && (
                        <span className="text-xs text-text-muted">
                          Prazo: {fmtDate(p.deadline)}
                        </span>
                      )}
                      {total === 0 && (
                        <span className="text-xs text-text-muted">Sem tarefas</span>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditing(p); setModalOpen(true) }}
                        className="p-1.5 rounded text-text-muted hover:text-text hover:bg-bg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-bg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <ProjectModal
          project={editing ?? undefined}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}
    </AppShell>
  )
}
