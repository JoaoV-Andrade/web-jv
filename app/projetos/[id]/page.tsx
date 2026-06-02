"use client"

import { useState, useEffect, useRef, use } from "react"
import { AppShell } from "@/components/app-shell"
import { TaskModal, type Task } from "../_components/task-modal"
import { ProjectModal } from "../_components/project-modal"
import { Plus, ArrowLeft, Pencil, Trash2, ChevronRight, ChevronLeft } from "lucide-react"
import Link from "next/link"

type Subtask = { id: string; title: string; done: boolean }
type Project = {
  id: string
  name: string
  description: string | null
  status: string
  deadline: string | null
  tasks: Task[]
}

const COLUMNS: { status: Task["status"]; label: string }[] = [
  { status: "TODO", label: "A Fazer" },
  { status: "IN_PROGRESS", label: "Em Andamento" },
  { status: "DONE", label: "Concluído" },
]

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-text-muted bg-surface-2",
  MEDIUM: "text-warning bg-warning/10",
  HIGH: "text-danger bg-danger/10",
}
const PRIORITY_LABELS: Record<string, string> = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta" }
const fmtDate = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/")

const STATUS_ORDER: Task["status"][] = ["TODO", "IN_PROGRESS", "DONE"]

export default function KanbanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [taskModal, setTaskModal] = useState<{ open: boolean; task?: Task }>({ open: false })
  const [projectModal, setProjectModal] = useState(false)
  const draggingId = useRef<string | null>(null)

  useEffect(() => {
    fetch(`/api/projetos/${id}`)
      .then((r) => r.json())
      .then((data) => { setProject(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  async function moveTask(taskId: string, newStatus: Task["status"]) {
    if (!project) return
    const task = project.tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    setProject((prev) =>
      prev ? { ...prev, tasks: prev.tasks.map((t) => t.id === taskId ? { ...t, status: newStatus } : t) } : prev
    )

    await fetch(`/api/projetos/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...task, status: newStatus, deadline: task.deadline?.slice(0, 10) || null }),
    })
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Excluir esta tarefa?")) return
    await fetch(`/api/projetos/tasks/${taskId}`, { method: "DELETE" })
    setProject((prev) =>
      prev ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) } : prev
    )
  }

  async function toggleSubtask(taskId: string, sub: Subtask) {
    const res = await fetch(`/api/projetos/subtasks/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !sub.done }),
    })
    if (!res.ok) return
    setProject((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id !== taskId
                ? t
                : { ...t, subtasks: t.subtasks.map((s) => s.id === sub.id ? { ...s, done: !s.done } : s) }
            ),
          }
        : prev
    )
  }

  function handleTaskSaved(saved: Task) {
    setProject((prev) => {
      if (!prev) return prev
      const exists = prev.tasks.find((t) => t.id === saved.id)
      return {
        ...prev,
        tasks: exists
          ? prev.tasks.map((t) => (t.id === saved.id ? saved : t))
          : [...prev.tasks, saved],
      }
    })
    setTaskModal({ open: false })
  }

  function handleProjectSaved(p: { id: string; name: string; description: string | null; status: string; deadline: string | null; tasks: { id: string; status: string }[] }) {
    setProject((prev) => prev ? { ...prev, name: p.name, description: p.description, status: p.status, deadline: p.deadline } : prev)
    setProjectModal(false)
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-text-muted text-sm">Carregando...</p>
      </AppShell>
    )
  }

  if (!project) {
    return (
      <AppShell>
        <p className="text-text-muted text-sm">Projeto não encontrado.</p>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <Link href="/projetos" className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text mb-1">
              <ArrowLeft size={12} /> Projetos
            </Link>
            <h1 className="font-serif text-2xl text-text">{project.name}</h1>
            {project.description && (
              <p className="text-xs text-text-muted mt-0.5">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setProjectModal(true)}
              className="p-2 text-text-muted border border-border rounded-[var(--radius-sm)] hover:bg-surface-2 transition-colors"
              title="Editar projeto"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setTaskModal({ open: true })}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-accent text-white font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover transition-colors"
            >
              <Plus size={14} /> Tarefa
            </button>
          </div>
        </div>

        {/* Kanban columns */}
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {COLUMNS.map((col) => {
            const tasks = project.tasks
              .filter((t) => t.status === col.status)
              .sort((a, b) => a.position - b.position)

            return (
              <div
                key={col.status}
                className="flex flex-col gap-3 min-w-72 w-72 shrink-0"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggingId.current) moveTask(draggingId.current, col.status)
                }}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-medium text-text">{col.label}</h2>
                  <span className="text-xs text-text-muted bg-surface-2 px-2 py-0.5 rounded-full">
                    {tasks.length}
                  </span>
                </div>

                {/* Drop zone */}
                <div className="flex flex-col gap-2 flex-1 min-h-16 rounded-[var(--radius)] p-1 transition-colors">
                  {tasks.map((task) => {
                    const doneSubs = task.subtasks.filter((s) => s.done).length
                    const totalSubs = task.subtasks.length
                    const colIdx = STATUS_ORDER.indexOf(col.status)

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => { draggingId.current = task.id }}
                        onDragEnd={() => { draggingId.current = null }}
                        className="bg-surface border border-border rounded-[var(--radius-sm)] p-3.5 flex flex-col gap-2.5 cursor-grab active:cursor-grabbing hover:border-accent/30 transition-colors group"
                        style={{ boxShadow: "var(--shadow)" }}
                      >
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-text leading-snug flex-1">{task.title}</p>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => setTaskModal({ open: true, task })}
                              className="p-1 rounded text-text-muted hover:text-text transition-colors"
                              title="Editar"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-1 rounded text-text-muted hover:text-danger transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className="text-xs text-text-muted line-clamp-2">{task.description}</p>
                        )}

                        {/* Subtasks */}
                        {totalSubs > 0 && (
                          <div className="space-y-1">
                            {task.subtasks.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => toggleSubtask(task.id, s)}
                                className="flex items-center gap-2 w-full text-left group/sub"
                              >
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${s.done ? "bg-accent border-accent" : "border-border group-hover/sub:border-accent"}`}>
                                  {s.done && <span className="text-white text-[9px] leading-none">✓</span>}
                                </div>
                                <span className={`text-xs ${s.done ? "line-through text-text-muted" : "text-text"}`}>
                                  {s.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between gap-2 mt-auto">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority]}`}>
                              {PRIORITY_LABELS[task.priority]}
                            </span>
                            {task.deadline && (
                              <span className="text-[10px] text-text-muted">{fmtDate(task.deadline)}</span>
                            )}
                            {totalSubs > 0 && (
                              <span className="text-[10px] text-text-muted">{doneSubs}/{totalSubs}</span>
                            )}
                          </div>
                          {/* Move arrows */}
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {colIdx > 0 && (
                              <button
                                onClick={() => moveTask(task.id, STATUS_ORDER[colIdx - 1])}
                                className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
                                title="Mover para esquerda"
                              >
                                <ChevronLeft size={12} />
                              </button>
                            )}
                            {colIdx < STATUS_ORDER.length - 1 && (
                              <button
                                onClick={() => moveTask(task.id, STATUS_ORDER[colIdx + 1])}
                                className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
                                title="Mover para direita"
                              >
                                <ChevronRight size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Add task shortcut */}
                  <button
                    onClick={() => setTaskModal({ open: true })}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-text-muted hover:text-text rounded-[var(--radius-sm)] hover:bg-surface transition-colors w-full"
                  >
                    <Plus size={12} /> Adicionar tarefa
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {taskModal.open && (
        <TaskModal
          projectId={id}
          task={taskModal.task}
          onClose={() => setTaskModal({ open: false })}
          onSaved={handleTaskSaved}
        />
      )}

      {projectModal && (
        <ProjectModal
          project={project}
          onClose={() => setProjectModal(false)}
          onSaved={handleProjectSaved}
        />
      )}
    </AppShell>
  )
}
