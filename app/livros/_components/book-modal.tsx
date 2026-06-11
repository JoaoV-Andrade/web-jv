"use client"

import { useState } from "react"
import { X, Star } from "lucide-react"

type Book = {
  id: string
  title: string
  author: string | null
  description: string | null
  status: string
  rating: number | null
  coverUrl: string | null
  notes: string | null
}

type Props = {
  book?: Book
  initialStatus?: string
  onClose: () => void
  onSaved: (b: Book) => void
}

const STATUS_LABELS: Record<string, string> = {
  WANT_TO_READ: "Quero ler",
  READING: "Lendo",
  READ: "Lido",
}

export function BookModal({ book, initialStatus, onClose, onSaved }: Props) {
  const isEditing = !!book
  const [title, setTitle] = useState(book?.title ?? "")
  const [author, setAuthor] = useState(book?.author ?? "")
  const [description, setDescription] = useState(book?.description ?? "")
  const [status, setStatus] = useState(book?.status ?? initialStatus ?? "WANT_TO_READ")
  const [rating, setRating] = useState<number | null>(book?.rating ?? null)
  const [coverUrl, setCoverUrl] = useState(book?.coverUrl ?? "")
  const [notes, setNotes] = useState(book?.notes ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError("Título obrigatório"); return }
    setSaving(true)
    setError("")
    try {
      const url = isEditing ? `/api/livros/${book.id}` : "/api/livros"
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author || null,
          description: description || null,
          status,
          rating,
          coverUrl: coverUrl || null,
          notes: notes || null,
        }),
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
      <div className="relative bg-surface border border-border rounded-[var(--radius)] w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ boxShadow: "var(--shadow)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface z-10">
          <h2 className="font-medium text-text">{isEditing ? "Editar livro" : "Adicionar livro"}</h2>
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
              placeholder="Ex: Dom Casmurro, O Hobbit..."
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Autor</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Ex: Machado de Assis"
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>
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
          {status === "READ" && (
            <div>
              <label className="block text-xs text-text-muted mb-2">Avaliação</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(rating === n ? null : n)}
                    className="p-0.5 transition-colors"
                  >
                    <Star
                      size={20}
                      className={n <= (rating ?? 0) ? "fill-accent text-accent" : "text-border"}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs text-text-muted mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Sinopse ou comentário..."
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Notas pessoais</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anotações, citações favoritas..."
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">URL da capa</label>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm text-text-muted border border-border rounded-[var(--radius-sm)] hover:bg-surface-2 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm bg-accent text-white font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover disabled:opacity-50 transition-colors">
              {saving ? "Salvando..." : isEditing ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
