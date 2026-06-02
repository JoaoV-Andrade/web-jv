"use client"

import { useState } from "react"
import { X, Plus, Trash2 } from "lucide-react"

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

type Props = {
  trip?: Trip
  onClose: () => void
  onSaved: (t: Trip) => void
}

const STATUS_LABELS: Record<string, string> = {
  DREAMING:  "Quero ir",
  PLANNED:   "Planejada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
}

export function TripModal({ trip, onClose, onSaved }: Props) {
  const isEditing = !!trip
  const today = new Date().toISOString().slice(0, 10)

  const [destination, setDestination] = useState(trip?.destination ?? "")
  const [startDate, setStartDate] = useState(trip?.startDate?.slice(0, 10) ?? today)
  const [endDate, setEndDate] = useState(trip?.endDate?.slice(0, 10) ?? today)
  const [status, setStatus] = useState(trip?.status ?? "PLANNED")
  const [notes, setNotes] = useState(trip?.notes ?? "")
  const [links, setLinks] = useState<string[]>(trip?.links ?? [])
  const [newLink, setNewLink] = useState("")
  const [outboundFlight, setOutboundFlight] = useState(trip?.outboundFlight ?? "")
  const [returnFlight, setReturnFlight] = useState(trip?.returnFlight ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const isDreaming = status === "DREAMING"
  const isConfirmed = status === "CONFIRMED"

  function addLink() {
    const url = newLink.trim()
    if (!url) return
    setLinks((prev) => [...prev, url])
    setNewLink("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!destination.trim()) { setError("Destino obrigatório"); return }
    if (!isDreaming) {
      if (!startDate || !endDate) { setError("Datas obrigatórias"); return }
      if (endDate < startDate) { setError("Data de volta não pode ser antes da ida"); return }
    }
    if (isConfirmed) {
      if (!outboundFlight.trim()) { setError("Número do voo de ida obrigatório"); return }
      if (!returnFlight.trim()) { setError("Número do voo de volta obrigatório"); return }
    }

    setSaving(true)
    setError("")
    try {
      const url = isEditing ? `/api/viagens/${trip.id}` : "/api/viagens"
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: destination.trim(),
          startDate: isDreaming ? null : startDate,
          endDate: isDreaming ? null : endDate,
          status,
          notes: notes || null,
          links,
          outboundFlight: outboundFlight.trim() || null,
          returnFlight: returnFlight.trim() || null,
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
      <div
        className="relative bg-surface border border-border rounded-[var(--radius)] w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "var(--shadow)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-medium text-text">{isEditing ? "Editar viagem" : "Nova viagem"}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-text-muted hover:bg-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Destination */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Destino *</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ex: Paris, Tokyo, Florianópolis..."
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>

          {/* Status */}
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

          {/* Dates — hidden for DREAMING */}
          {!isDreaming && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Ida *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); if (e.target.value > endDate) setEndDate(e.target.value) }}
                  className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Volta *</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          {/* Flights — shown and required for CONFIRMED */}
          {isConfirmed && (
            <div className="space-y-3 p-3 bg-surface-2 rounded-[var(--radius-sm)] border border-border">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Voos confirmados</p>
              <div>
                <label className="block text-xs text-text-muted mb-1">Voo de ida *</label>
                <input
                  type="text"
                  value={outboundFlight}
                  onChange={(e) => setOutboundFlight(e.target.value)}
                  placeholder="Ex: LA 3541, G3 1234..."
                  className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Voo de volta *</label>
                <input
                  type="text"
                  value={returnFlight}
                  onChange={(e) => setReturnFlight(e.target.value)}
                  placeholder="Ex: LA 3542, G3 5678..."
                  className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Hotéis, roteiro, observações..."
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Links */}
          <div>
            <label className="block text-xs text-text-muted mb-2">Links</label>
            {links.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <span className="text-xs text-accent truncate flex-1">{link}</span>
                    <button
                      type="button"
                      onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-text-muted hover:text-danger transition-all shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink() } }}
                placeholder="https://..."
                className="flex-1 px-2.5 py-1.5 text-xs bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={addLink}
                className="px-2.5 py-1.5 text-xs bg-surface-2 border border-border rounded-[var(--radius-sm)] text-text-muted hover:text-text transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {isEditing && trip.calendarEventId && (
            <p className="text-xs text-text-muted flex items-center gap-1.5">
              <span>📅</span> Sincronizado com o Google Agenda
            </p>
          )}

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-text-muted border border-border rounded-[var(--radius-sm)] hover:bg-surface-2 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm bg-accent text-white font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {saving ? "Salvando..." : isEditing ? "Salvar" : "Criar viagem"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
