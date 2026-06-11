"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { BookModal } from "./_components/book-modal"
import { Plus, Pencil, Trash2, BookOpen, Star } from "lucide-react"

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

const SECTIONS = [
  { status: "READING",      label: "Lendo",      color: "text-accent",   bgColor: "bg-accent-soft" },
  { status: "READ",         label: "Lidos",       color: "text-success",  bgColor: "bg-success/10"  },
  { status: "WANT_TO_READ", label: "Quero ler",   color: "text-text-muted", bgColor: "bg-surface-2" },
] as const

export default function LivrosPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Book | null>(null)
  const [initialStatus, setInitialStatus] = useState<string>("WANT_TO_READ")

  useEffect(() => {
    fetch("/api/livros")
      .then((r) => r.json())
      .then((data) => { setBooks(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm("Excluir este livro?")) return
    await fetch(`/api/livros/${id}`, { method: "DELETE" })
    setBooks((prev) => prev.filter((b) => b.id !== id))
  }

  function handleSaved(b: Book) {
    setBooks((prev) => {
      const exists = prev.find((x) => x.id === b.id)
      return exists ? prev.map((x) => (x.id === b.id ? b : x)) : [b, ...prev]
    })
    setModalOpen(false)
    setEditing(null)
  }

  function openNew(status: string) {
    setEditing(null)
    setInitialStatus(status)
    setModalOpen(true)
  }

  function openEdit(b: Book) {
    setEditing(b)
    setModalOpen(true)
  }

  return (
    <AppShell>
      <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl text-text">Livros</h1>
          <button
            onClick={() => openNew("WANT_TO_READ")}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-accent text-white font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover transition-colors"
          >
            <Plus size={14} /> Adicionar livro
          </button>
        </div>

        {loading ? (
          <p className="text-text-muted text-sm">Carregando...</p>
        ) : (
          <div className="space-y-8">
            {SECTIONS.map(({ status, label, color, bgColor }) => {
              const sectionBooks = books.filter((b) => b.status === status)
              return (
                <div key={status}>
                  {/* Section header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h2 className={`font-medium text-sm ${color}`}>{label}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bgColor} ${color}`}>
                        {sectionBooks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => openNew(status)}
                      className="text-xs text-text-muted hover:text-text flex items-center gap-1 transition-colors"
                    >
                      <Plus size={12} /> Adicionar
                    </button>
                  </div>

                  {sectionBooks.length === 0 ? (
                    <div
                      onClick={() => openNew(status)}
                      className="border border-dashed border-border rounded-[var(--radius)] py-8 text-center cursor-pointer hover:border-accent hover:bg-surface-2 transition-colors"
                    >
                      <BookOpen size={24} className="text-border mx-auto mb-2" />
                      <p className="text-text-muted text-xs">Nenhum livro aqui ainda</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {sectionBooks.map((b) => (
                        <BookCard
                          key={b.id}
                          book={b}
                          onEdit={() => openEdit(b)}
                          onDelete={() => handleDelete(b.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <BookModal
          book={editing ?? undefined}
          initialStatus={initialStatus}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}
    </AppShell>
  )
}

function BookCard({ book, onEdit, onDelete }: { book: Book; onEdit: () => void; onDelete: () => void }) {
  return (
    <div
      className="bg-surface border border-border rounded-[var(--radius)] p-4 flex gap-3 hover:bg-surface-2 transition-colors group"
      style={{ boxShadow: "var(--shadow)" }}
    >
      {/* Cover */}
      {book.coverUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-12 h-16 object-cover rounded shrink-0"
        />
      ) : (
        <div className="w-12 h-16 bg-surface-2 border border-border rounded shrink-0 flex items-center justify-center">
          <BookOpen size={16} className="text-border" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-medium text-text text-sm leading-tight line-clamp-2">{book.title}</h3>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={onEdit}
              className="p-1 rounded text-text-muted hover:text-text hover:bg-bg transition-colors"
              title="Editar"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded text-text-muted hover:text-danger hover:bg-bg transition-colors"
              title="Excluir"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {book.author && (
          <p className="text-xs text-text-muted">{book.author}</p>
        )}

        {book.rating !== null && (
          <div className="flex gap-0.5 mt-auto pt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={11}
                className={n <= book.rating! ? "fill-accent text-accent" : "text-border"}
              />
            ))}
          </div>
        )}

        {book.description && !book.rating && (
          <p className="text-xs text-text-muted line-clamp-2 mt-auto pt-1">{book.description}</p>
        )}
      </div>
    </div>
  )
}
