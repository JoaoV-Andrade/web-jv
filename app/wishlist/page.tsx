"use client"

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { WishlistModal, type WishlistItem } from "./_components/wishlist-modal"
import { Plus, Pencil, Trash2, Heart, ExternalLink, ShoppingBag } from "lucide-react"

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const PRIORITY_CONFIG = {
  LOW:    { label: "Baixa",  classes: "text-text-muted bg-surface-2" },
  MEDIUM: { label: "Média",  classes: "text-warning bg-warning/10" },
  HIGH:   { label: "Alta",   classes: "text-danger bg-danger/10" },
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"ALL" | "WANTED" | "BOUGHT">("ALL")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WishlistItem | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter !== "ALL") params.set("status", statusFilter)
    if (categoryFilter !== "ALL") params.set("category", categoryFilter)
    fetch(`/api/wishlist?${params}`)
      .then((r) => r.json())
      .then((data) => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [statusFilter, categoryFilter])

  const categories = useMemo(() => {
    const all = items.map((i) => i.category).filter(Boolean) as string[]
    return [...new Set(all)].sort()
  }, [items])

  async function toggleStatus(item: WishlistItem) {
    const newStatus = item.status === "WANTED" ? "BOUGHT" : "WANTED"
    const res = await fetch(`/api/wishlist/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, status: newStatus }),
    })
    if (res.ok) {
      const updated: WishlistItem = await res.json()
      setItems((prev) => prev.map((x) => (x.id === item.id ? updated : x)))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este item?")) return
    await fetch(`/api/wishlist/${id}`, { method: "DELETE" })
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  function handleSaved(saved: WishlistItem) {
    setItems((prev) => {
      const exists = prev.find((x) => x.id === saved.id)
      return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev]
    })
    setModalOpen(false)
    setEditing(null)
  }

  const wanted = items.filter((i) => i.status === "WANTED")
  const bought = items.filter((i) => i.status === "BOUGHT")
  const totalWanted = wanted.reduce((s, i) => s + (i.price ?? 0), 0)

  function ItemCard({ item }: { item: WishlistItem }) {
    const bought = item.status === "BOUGHT"
    const pCfg = PRIORITY_CONFIG[item.priority]

    return (
      <div
        className={`bg-surface border border-border rounded-[var(--radius)] overflow-hidden group transition-colors hover:bg-surface-2 flex flex-col ${bought ? "opacity-70" : ""}`}
        style={{ boxShadow: "var(--shadow)" }}
      >
        {/* Image */}
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className={`w-full h-40 object-cover ${bought ? "grayscale" : ""}`}
          />
        ) : (
          <div className="w-full h-28 bg-surface-2 flex items-center justify-center">
            <ShoppingBag size={28} className="text-border" />
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          {/* Title + actions */}
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-sm font-medium text-text leading-snug flex-1 ${bought ? "line-through text-text-muted" : ""}`}>
              {item.title}
            </h3>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => { setEditing(item); setModalOpen(true) }}
                className="p-1.5 rounded text-text-muted hover:text-text transition-colors"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 rounded text-text-muted hover:text-danger transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Price */}
          {item.price != null && (
            <p className={`text-base font-semibold ${bought ? "text-text-muted" : "text-text"}`}>
              {fmt(item.price)}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${pCfg.classes}`}>
              {pCfg.label}
            </span>
            {item.category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-text-muted">
                {item.category}
              </span>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-xs text-text-muted line-clamp-2">{item.description}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-1 gap-2">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={11} /> Ver produto
              </a>
            ) : (
              <div />
            )}

            {/* Toggle status */}
            <button
              onClick={() => toggleStatus(item)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                bought
                  ? "bg-success/10 text-success hover:bg-success/20"
                  : "bg-accent-soft text-accent hover:bg-accent/20"
              }`}
            >
              {bought ? "✓ Comprado" : "Quero"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AppShell>
      <div className="max-w-5xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl text-text">Wishlist</h1>
            {!loading && wanted.length > 0 && (
              <p className="text-xs text-text-muted mt-0.5">
                {wanted.length} {wanted.length === 1 ? "item" : "itens"} desejados
                {totalWanted > 0 && ` · total estimado ${fmt(totalWanted)}`}
              </p>
            )}
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-accent text-white font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover transition-colors"
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Status filter */}
          <div className="flex gap-1 bg-surface border border-border rounded-[var(--radius-sm)] p-1">
            {(["ALL", "WANTED", "BOUGHT"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                  statusFilter === s ? "bg-accent-soft text-accent" : "text-text-muted hover:text-text"
                }`}
              >
                {s === "ALL" ? "Todos" : s === "WANTED" ? "Quero" : "Comprado"}
              </button>
            ))}
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-surface border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
            >
              <option value="ALL">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <p className="text-text-muted text-sm">Carregando...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={40} className="text-border mx-auto mb-3" />
            <p className="text-text-muted text-sm mb-3">
              {statusFilter !== "ALL" || categoryFilter !== "ALL"
                ? "Nenhum item encontrado com esses filtros."
                : "Sua wishlist está vazia."}
            </p>
            {statusFilter === "ALL" && categoryFilter === "ALL" && (
              <button
                onClick={() => setModalOpen(true)}
                className="text-sm text-accent hover:text-accent-hover"
              >
                + Adicionar primeiro item
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Wanted section */}
            {wanted.length > 0 && (statusFilter === "ALL" || statusFilter === "WANTED") && (
              <section className="space-y-3">
                {statusFilter === "ALL" && bought.length > 0 && (
                  <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Quero
                  </h2>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {wanted.map((i) => <ItemCard key={i.id} item={i} />)}
                </div>
              </section>
            )}

            {/* Bought section */}
            {bought.length > 0 && (statusFilter === "ALL" || statusFilter === "BOUGHT") && (
              <section className="space-y-3">
                {statusFilter === "ALL" && wanted.length > 0 && (
                  <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Comprado
                  </h2>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {bought.map((i) => <ItemCard key={i.id} item={i} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <WishlistModal
          item={editing ?? undefined}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}
    </AppShell>
  )
}
