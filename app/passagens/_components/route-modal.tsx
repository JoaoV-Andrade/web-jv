"use client"

import { useState } from "react"
import { X } from "lucide-react"

export type WatchedRoute = {
  id: string
  origin: string
  destination: string
  departureDateFrom: string
  departureDateTo: string
  passengers: number
  targetPrice: number | null
  lastNotifiedAt: string | null
  lastNotifiedPrice: number | null
  priceHistory: { id: string; price: number; currency: string; checkedAt: string }[]
}

type Props = {
  route?: WatchedRoute
  onClose: () => void
  onSaved: (r: WatchedRoute) => void
}

export function RouteModal({ route, onClose, onSaved }: Props) {
  const isEditing = !!route
  const today = new Date().toISOString().slice(0, 10)

  const [origin, setOrigin] = useState(route?.origin ?? "")
  const [destination, setDestination] = useState(route?.destination ?? "")
  const [dateFrom, setDateFrom] = useState(route?.departureDateFrom.slice(0, 10) ?? today)
  const [dateTo, setDateTo] = useState(route?.departureDateTo.slice(0, 10) ?? today)
  const [passengers, setPassengers] = useState(String(route?.passengers ?? 1))
  const [targetPrice, setTargetPrice] = useState(route?.targetPrice != null ? String(route.targetPrice) : "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!origin.trim() || !destination.trim()) { setError("Origem e destino obrigatórios"); return }
    if (!dateFrom || !dateTo) { setError("Datas obrigatórias"); return }
    if (dateTo < dateFrom) { setError("Data final deve ser após a data inicial"); return }

    setSaving(true)
    setError("")
    try {
      const url = isEditing ? `/api/passagens/${route.id}` : "/api/passagens"
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: origin.trim().toUpperCase(),
          destination: destination.trim().toUpperCase(),
          departureDateFrom: dateFrom,
          departureDateTo: dateTo,
          passengers: Number(passengers) || 1,
          targetPrice: targetPrice ? Number(targetPrice) : null,
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
        className="relative bg-surface border border-border rounded-[var(--radius)] w-full max-w-md"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-medium text-text">{isEditing ? "Editar rota" : "Monitorar rota"}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-text-muted hover:bg-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Origin + Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Origem (IATA) *</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="GRU"
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent uppercase font-mono tracking-widest"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Destino (IATA) *</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="CDG"
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent uppercase font-mono tracking-widest"
              />
            </div>
          </div>

          <p className="text-[10px] text-text-muted -mt-2">
            Código IATA de 3 letras — ex: GRU, CGH, SDU, GIG, BSB, CDG, LHR, JFK
          </p>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Ida a partir de *</label>
              <input
                type="date"
                value={dateFrom}
                min={today}
                onChange={(e) => { setDateFrom(e.target.value); if (e.target.value > dateTo) setDateTo(e.target.value) }}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Ida até *</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Passengers + Target price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Passageiros</label>
              <input
                type="number"
                min="1"
                max="9"
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Preço alvo (R$)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="Ex: 2500"
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <p className="text-[10px] text-text-muted -mt-2">
            Você receberá uma notificação no Telegram quando o preço atingir o alvo.
          </p>

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
              {saving ? "Salvando..." : isEditing ? "Salvar" : "Monitorar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
