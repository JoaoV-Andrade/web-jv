"use client"

import { useState } from "react"
import { X } from "lucide-react"

export type InstallmentData = {
  id: string
  name: string
  store: string | null
  totalAmount: number
  installmentAmount: number
  totalInstallments: number
  paidInstallments: number
  dueDay: number | null
  startDate: string
  status: string
}

type Props = {
  installment?: InstallmentData
  onClose: () => void
  onSaved: (inst: InstallmentData) => void
}

export function InstallmentModal({ installment, onClose, onSaved }: Props) {
  const isEditing = !!installment

  const [name, setName] = useState(installment?.name ?? "")
  const [store, setStore] = useState(installment?.store ?? "")
  const [totalAmount, setTotalAmount] = useState(installment ? String(installment.totalAmount) : "")
  const [installmentAmount, setInstallmentAmount] = useState(
    installment ? String(installment.installmentAmount) : ""
  )
  const [totalInstallments, setTotalInstallments] = useState(
    installment ? String(installment.totalInstallments) : ""
  )
  const [paidInstallments, setPaidInstallments] = useState(
    installment ? String(installment.paidInstallments) : "0"
  )
  const [dueDay, setDueDay] = useState(installment?.dueDay ? String(installment.dueDay) : "")
  const [startDate, setStartDate] = useState(
    installment ? installment.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!name.trim()) { setError("Nome obrigatório."); return }
    if (!totalAmount || Number(totalAmount) <= 0) { setError("Valor total inválido."); return }
    if (!installmentAmount || Number(installmentAmount) <= 0) { setError("Valor da parcela inválido."); return }
    if (!totalInstallments || Number(totalInstallments) < 1) { setError("Número de parcelas inválido."); return }

    setSaving(true)
    try {
      const url = isEditing
        ? `/api/financas/installments/${installment.id}`
        : "/api/financas/installments"
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          store: store.trim() || null,
          totalAmount: Number(totalAmount),
          installmentAmount: Number(installmentAmount),
          totalInstallments: Number(totalInstallments),
          paidInstallments: isEditing ? Number(paidInstallments) : 0,
          dueDay: dueDay ? Number(dueDay) : null,
          startDate,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao salvar")
      const saved: InstallmentData = await res.json()
      onSaved(saved)
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-medium text-text">
            {isEditing ? "Editar parcelamento" : "Novo parcelamento"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-text-muted hover:bg-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: iPhone 15, Geladeira..."
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">Loja / Credor</label>
            <input
              type="text"
              value={store}
              onChange={(e) => setStore(e.target.value)}
              placeholder="Ex: Apple Store, Nubank..."
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Valor total (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Valor da parcela (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Total de parcelas *</label>
              <input
                type="number"
                min="1"
                step="1"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                placeholder="12"
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
                required
              />
            </div>
            {isEditing && (
              <div>
                <label className="block text-xs text-text-muted mb-1">Parcelas pagas</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={paidInstallments}
                  onChange={(e) => setPaidInstallments(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Data da 1ª parcela *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Dia do vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                step="1"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="Ex: 10"
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

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
              {saving ? "Salvando..." : isEditing ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
