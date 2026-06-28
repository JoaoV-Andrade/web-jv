"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Settings } from "lucide-react"

type MeiSettings = {
  openingMonth: number
  openingYear: number
  annualLimit: number
  monthlyLimit: number
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function MeiSettingsForm({ initial }: { initial: MeiSettings | null }) {
  const router = useRouter()
  const now = new Date()
  const [open, setOpen] = useState(!initial)
  const [openingMonth, setOpeningMonth] = useState(initial?.openingMonth ?? now.getMonth() + 1)
  const [openingYear, setOpeningYear] = useState(initial?.openingYear ?? now.getFullYear())
  const [annualLimit, setAnnualLimit] = useState(String(initial?.annualLimit ?? 81000))
  const [monthlyLimit, setMonthlyLimit] = useState(String(initial?.monthlyLimit ?? 6750))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSaving(true)
    try {
      const res = await fetch("/api/financas/mei/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openingMonth: Number(openingMonth),
          openingYear: Number(openingYear),
          annualLimit: Number(annualLimit),
          monthlyLimit: Number(monthlyLimit),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao salvar")
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="bg-surface border border-border rounded-[var(--radius)] p-5"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-text">Configuração do MEI</h2>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted border border-border rounded-[var(--radius-sm)] hover:bg-surface-2 transition-colors"
          >
            <Settings size={12} /> Editar
          </button>
        )}
      </div>

      {!open ? (
        <div className="text-sm text-text-muted space-y-1">
          <p>
            Abertura: <span className="text-text">{MONTH_NAMES[(initial!.openingMonth) - 1]} de {initial!.openingYear}</span>
          </p>
          <p>
            Limite anual: <span className="text-text">{fmt(initial!.annualLimit)}</span> · Teto mensal:{" "}
            <span className="text-text">{fmt(initial!.monthlyLimit)}</span>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Mês de abertura *</label>
              <select
                value={openingMonth}
                onChange={(e) => setOpeningMonth(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Ano de abertura *</label>
              <input
                type="number"
                value={openingYear}
                onChange={(e) => setOpeningYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Limite anual (R$)</label>
              <input
                type="number"
                step="0.01"
                value={annualLimit}
                onChange={(e) => setAnnualLimit(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Teto mensal (R$)</label>
              <input
                type="number"
                step="0.01"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <p className="text-xs text-text-muted">
            No ano de abertura o limite é proporcional aos meses restantes do ano.
          </p>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-3 pt-1">
            {initial && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 text-sm text-text-muted border border-border rounded-[var(--radius-sm)] hover:bg-surface-2 transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm bg-accent text-white font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
