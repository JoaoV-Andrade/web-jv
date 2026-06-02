"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { RouteModal, type WatchedRoute } from "./_components/route-modal"
import { Plus, Pencil, Trash2, TrendingDown, RefreshCw, Bell, BellOff } from "lucide-react"

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

const fmtDate = (iso: string) =>
  iso.slice(0, 10).split("-").reverse().join("/")

export default function PassagensPage() {
  const [routes, setRoutes] = useState<WatchedRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WatchedRoute | null>(null)
  const [checking, setChecking] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/passagens")
      .then((r) => r.json())
      .then((data) => { setRoutes(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta rota monitorada?")) return
    await fetch(`/api/passagens/${id}`, { method: "DELETE" })
    setRoutes((prev) => prev.filter((r) => r.id !== id))
  }

  function handleSaved(r: WatchedRoute) {
    setRoutes((prev) => {
      const exists = prev.find((x) => x.id === r.id)
      return exists ? prev.map((x) => (x.id === r.id ? r : x)) : [r, ...prev]
    })
    setModalOpen(false)
    setEditing(null)
  }

  async function handleCheck(id: string) {
    setChecking(id)
    try {
      const res = await fetch(`/api/passagens/${id}/check`, { method: "POST" })
      const data = await res.json()
      if (res.ok && data.route) {
        setRoutes((prev) => prev.map((r) => (r.id === id ? data.route : r)))
      } else {
        alert(data.error ?? "Erro ao verificar preço")
      }
    } finally {
      setChecking(null)
    }
  }

  function RouteCard({ route }: { route: WatchedRoute }) {
    const latest = route.priceHistory[0]
    const prev = route.priceHistory[1]
    const trend = latest && prev
      ? latest.price < prev.price ? "down" : latest.price > prev.price ? "up" : "flat"
      : null
    const hasTarget = route.targetPrice != null
    const belowTarget = hasTarget && latest && latest.price <= route.targetPrice!
    const isChecking = checking === route.id

    return (
      <div
        className="bg-surface border border-border rounded-[var(--radius)] p-5 group transition-colors hover:bg-surface-2"
        style={{ boxShadow: "var(--shadow)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-accent-soft flex items-center justify-center shrink-0">
              <TrendingDown size={16} className="text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-text tracking-wide">
                  {route.origin}
                </span>
                <span className="text-text-muted">→</span>
                <span className="font-mono font-semibold text-text tracking-wide">
                  {route.destination}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                📅 {fmtDate(route.departureDateFrom)} – {fmtDate(route.departureDateTo)}
                {route.passengers > 1 && ` · ${route.passengers} passageiros`}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => { setEditing(route); setModalOpen(true) }}
              className="p-1.5 rounded text-text-muted hover:text-text hover:bg-bg transition-colors"
              title="Editar"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => handleDelete(route.id)}
              className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-bg transition-colors"
              title="Excluir"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Price display */}
        <div className="flex items-end justify-between gap-4 mb-3">
          <div>
            {latest ? (
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-semibold ${belowTarget ? "text-success" : "text-text"}`}>
                  {fmt(latest.price)}
                </span>
                {trend === "down" && <span className="text-xs text-success">↓ caindo</span>}
                {trend === "up" && <span className="text-xs text-danger">↑ subindo</span>}
              </div>
            ) : (
              <span className="text-sm text-text-muted italic">Sem preço ainda</span>
            )}
            {latest && (
              <p className="text-[10px] text-text-muted mt-0.5">
                Verificado em {fmtDate(latest.checkedAt)}
              </p>
            )}
          </div>

          {/* Target price badge */}
          {hasTarget && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium ${belowTarget ? "bg-success/10 text-success" : "bg-surface-2 text-text-muted"}`}>
              {belowTarget ? <Bell size={11} /> : <BellOff size={11} />}
              alvo {fmt(route.targetPrice!)}
            </div>
          )}
        </div>

        {/* Price history mini */}
        {route.priceHistory.length > 1 && (
          <div className="flex items-center gap-2 mb-3 overflow-x-auto">
            {route.priceHistory.slice(0, 5).reverse().map((p, i, arr) => {
              const isLast = i === arr.length - 1
              return (
                <div key={p.id} className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs ${isLast ? "font-medium text-text" : "text-text-muted"}`}>
                    {fmt(p.price)}
                  </span>
                  {!isLast && <span className="text-text-muted/40 text-xs">→</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* Check button */}
        <button
          onClick={() => handleCheck(route.id)}
          disabled={isChecking}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors disabled:opacity-50"
        >
          <RefreshCw size={11} className={isChecking ? "animate-spin" : ""} />
          {isChecking ? "Verificando..." : "Verificar agora"}
        </button>
      </div>
    )
  }

  return (
    <AppShell>
      <div className="max-w-3xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl text-text">Passagens</h1>
            {!loading && routes.length > 0 && (
              <p className="text-xs text-text-muted mt-0.5">
                {routes.length} {routes.length === 1 ? "rota monitorada" : "rotas monitoradas"} · verificação diária às 09h
              </p>
            )}
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-accent text-white font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover transition-colors"
          >
            <Plus size={14} /> Monitorar rota
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-text-muted text-sm">Carregando...</p>
        ) : routes.length === 0 ? (
          <div className="text-center py-16">
            <TrendingDown size={40} className="text-border mx-auto mb-3" />
            <p className="text-text-muted text-sm mb-3">Nenhuma rota monitorada.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="text-sm text-accent hover:text-accent-hover"
            >
              + Adicionar primeira rota
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {routes.map((r) => <RouteCard key={r.id} route={r} />)}
          </div>
        )}
      </div>

      {modalOpen && (
        <RouteModal
          route={editing ?? undefined}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}
    </AppShell>
  )
}
