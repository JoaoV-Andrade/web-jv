"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { TripModal } from "./_components/trip-modal"
import { Plus, Pencil, Trash2, Plane, CalendarDays, ExternalLink } from "lucide-react"

type Trip = {
  id: string
  destination: string
  startDate: string | null
  endDate: string | null
  status: string
  notes: string | null
  links: string[]
  calendarEventId: string | null
  outboundFlight: string | null
  returnFlight: string | null
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  DREAMING:  { label: "Quero ir",   classes: "bg-warning/10 text-warning" },
  PLANNED:   { label: "Planejada",  classes: "bg-accent-soft text-accent" },
  CONFIRMED: { label: "Confirmada", classes: "bg-success/10 text-success" },
  COMPLETED: { label: "Realizada",  classes: "bg-surface-2 text-text-muted" },
  CANCELLED: { label: "Cancelada",  classes: "bg-danger/10 text-danger" },
}

const fmtDate = (iso: string) =>
  iso.slice(0, 10).split("-").reverse().join("/")

function tripDays(startIso: string, endIso: string) {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime()
  return Math.round(ms / 86_400_000) + 1
}

function linkLabel(url: string) {
  try { return new URL(url).hostname.replace("www.", "") }
  catch { return url }
}

export default function ViagensPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Trip | null>(null)

  useEffect(() => {
    fetch("/api/viagens")
      .then((r) => r.json())
      .then((data) => { setTrips(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta viagem? O evento no Google Agenda também será removido.")) return
    await fetch(`/api/viagens/${id}`, { method: "DELETE" })
    setTrips((prev) => prev.filter((t) => t.id !== id))
  }

  function handleSaved(t: Trip) {
    setTrips((prev) => {
      const exists = prev.find((x) => x.id === t.id)
      return exists ? prev.map((x) => (x.id === t.id ? t : x)) : [t, ...prev]
    })
    setModalOpen(false)
    setEditing(null)
  }

  const now = new Date().toISOString()

  const upcoming = trips
    .filter((t) =>
      (t.status === "DREAMING" || t.status === "PLANNED" || t.status === "CONFIRMED") &&
      (!t.endDate || t.endDate >= now)
    )
    .sort((a, b) => {
      // trips without dates (DREAMING) go after dated trips
      if (!a.startDate && !b.startDate) return 0
      if (!a.startDate) return 1
      if (!b.startDate) return -1
      return a.startDate.localeCompare(b.startDate)
    })

  const history = trips
    .filter((t) => t.status === "COMPLETED" || t.status === "CANCELLED" || (t.endDate && t.endDate < now))
    .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))

  function TripCard({ trip }: { trip: Trip }) {
    const cfg = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.PLANNED
    const cancelled = trip.status === "CANCELLED"
    const hasDates = trip.startDate && trip.endDate
    const days = hasDates ? tripDays(trip.startDate!, trip.endDate!) : null

    return (
      <div
        className={`bg-surface border border-border rounded-[var(--radius)] p-5 group transition-colors hover:bg-surface-2 ${cancelled ? "opacity-60" : ""}`}
        style={{ boxShadow: "var(--shadow)" }}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-accent-soft flex items-center justify-center shrink-0 mt-0.5">
              <Plane size={16} className="text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`font-medium text-text ${cancelled ? "line-through" : ""}`}>
                  {trip.destination}
                </h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${cfg.classes}`}>
                  {cfg.label}
                </span>
                {trip.calendarEventId && (
                  <span title="No Google Agenda"><CalendarDays size={13} className="text-text-muted shrink-0" /></span>
                )}
              </div>

              {hasDates ? (
                <p className="text-xs text-text-muted mt-0.5">
                  {fmtDate(trip.startDate!)} → {fmtDate(trip.endDate!)}
                  <span className="ml-1 text-text-muted/70">· {days} {days === 1 ? "dia" : "dias"}</span>
                </p>
              ) : (
                <p className="text-xs text-text-muted/60 mt-0.5 italic">Datas a definir</p>
              )}

              {/* Flights */}
              {(trip.outboundFlight || trip.returnFlight) && (
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {trip.outboundFlight && (
                    <span className="text-xs text-text-muted">
                      ✈ ida: <span className="font-medium text-text">{trip.outboundFlight}</span>
                    </span>
                  )}
                  {trip.returnFlight && (
                    <span className="text-xs text-text-muted">
                      ✈ volta: <span className="font-medium text-text">{trip.returnFlight}</span>
                    </span>
                  )}
                </div>
              )}

              {trip.notes && (
                <p className="text-xs text-text-muted mt-2 line-clamp-2 whitespace-pre-line">
                  {trip.notes}
                </p>
              )}

              {trip.links.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {trip.links.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] text-accent bg-accent/5 hover:bg-accent/10 px-1.5 py-0.5 rounded transition-colors"
                    >
                      <ExternalLink size={9} />
                      {linkLabel(link)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => { setEditing(trip); setModalOpen(true) }}
              className="p-1.5 rounded text-text-muted hover:text-text hover:bg-bg transition-colors"
              title="Editar"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => handleDelete(trip.id)}
              className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-bg transition-colors"
              title="Excluir"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl text-text">Viagens</h1>
          <button
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-accent text-white font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover transition-colors"
          >
            <Plus size={14} /> Nova viagem
          </button>
        </div>

        {loading ? (
          <p className="text-text-muted text-sm">Carregando...</p>
        ) : trips.length === 0 ? (
          <div className="text-center py-16">
            <Plane size={40} className="text-border mx-auto mb-3" />
            <p className="text-text-muted text-sm mb-3">Nenhuma viagem ainda.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="text-sm text-accent hover:text-accent-hover"
            >
              + Planejar primeira viagem
            </button>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Próximas
                </h2>
                {upcoming.map((t) => <TripCard key={t.id} trip={t} />)}
              </section>
            )}

            {history.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Histórico
                </h2>
                {history.map((t) => <TripCard key={t.id} trip={t} />)}
              </section>
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <TripModal
          trip={editing ?? undefined}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}
    </AppShell>
  )
}
