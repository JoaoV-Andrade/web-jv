"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, CreditCard, X } from "lucide-react"
import { InstallmentModal, type InstallmentData } from "./installment-modal"

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function InstallmentsSection({
  initialInstallments,
}: {
  initialInstallments: InstallmentData[]
}) {
  const [installments, setInstallments] = useState<InstallmentData[]>(initialInstallments)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<InstallmentData | null>(null)
  const [paying, setPaying] = useState<InstallmentData | null>(null)

  function handleSaved(saved: InstallmentData) {
    setInstallments((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    setModalOpen(false)
    setEditing(null)
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este parcelamento? As transações vinculadas serão desvinculadas.")) return
    const res = await fetch(`/api/financas/installments/${id}`, { method: "DELETE" })
    if (res.ok) {
      setInstallments((prev) => prev.filter((i) => i.id !== id))
    }
  }

  function handlePaid(updated: InstallmentData) {
    setInstallments((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    setPaying(null)
  }

  function openEdit(inst: InstallmentData) {
    setEditing(inst)
    setModalOpen(true)
  }

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  const active = installments.filter((i) => i.status === "ACTIVE")
  const completed = installments.filter((i) => i.status === "COMPLETED")

  const totalOutstanding = active.reduce(
    (sum, i) => sum + (i.totalInstallments - i.paidInstallments) * i.installmentAmount,
    0
  )

  return (
    <>
      <div
        className="bg-surface border border-border rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-medium text-text">Parcelamentos</h2>
            {active.length > 0 && (
              <p className="text-xs text-text-muted mt-0.5">
                Saldo em aberto:{" "}
                <span className="text-danger font-medium">{fmt(totalOutstanding)}</span>
              </p>
            )}
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent text-white font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover transition-colors"
          >
            <Plus size={12} /> Novo
          </button>
        </div>

        {installments.length === 0 ? (
          <p className="text-text-muted text-sm">
            Nenhum parcelamento.{" "}
            <button onClick={openCreate} className="text-accent hover:underline">
              Adicionar
            </button>
          </p>
        ) : (
          <div className="space-y-3">
            {active.map((inst) => (
              <InstallmentCard
                key={inst.id}
                inst={inst}
                onEdit={() => openEdit(inst)}
                onDelete={() => handleDelete(inst.id)}
                onRegisterPayment={() => setPaying(inst)}
              />
            ))}

            {completed.length > 0 && (
              <>
                {active.length > 0 && <hr className="border-border" />}
                <p className="text-xs text-text-muted font-medium uppercase tracking-wide">
                  Concluídos
                </p>
                {completed.map((inst) => (
                  <InstallmentCard
                    key={inst.id}
                    inst={inst}
                    onEdit={() => openEdit(inst)}
                    onDelete={() => handleDelete(inst.id)}
                    muted
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <InstallmentModal
          installment={editing ?? undefined}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}

      {paying && (
        <RegisterPaymentModal
          installment={paying}
          onClose={() => setPaying(null)}
          onPaid={handlePaid}
        />
      )}
    </>
  )
}

function InstallmentCard({
  inst,
  onEdit,
  onDelete,
  onRegisterPayment,
  muted = false,
}: {
  inst: InstallmentData
  onEdit: () => void
  onDelete: () => void
  onRegisterPayment?: () => void
  muted?: boolean
}) {
  const remaining = inst.totalInstallments - inst.paidInstallments
  const outstandingBalance = remaining * inst.installmentAmount
  const pct = inst.totalInstallments > 0 ? (inst.paidInstallments / inst.totalInstallments) * 100 : 0
  const currentInstallment = inst.paidInstallments + 1

  return (
    <div className={`rounded-[var(--radius-sm)] border border-border p-3 ${muted ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${muted ? "text-text-muted" : "text-text"}`}>
            {inst.name}
          </p>
          {inst.store && <p className="text-xs text-text-muted truncate">{inst.store}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onRegisterPayment && inst.status === "ACTIVE" && (
            <button
              onClick={onRegisterPayment}
              className="p-1.5 rounded text-text-muted hover:text-success hover:bg-surface-2 transition-colors"
              title="Registrar pagamento"
            >
              <CreditCard size={12} />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 rounded text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            title="Editar"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-surface-2 transition-colors"
            title="Excluir"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
        <span>
          {inst.status === "COMPLETED"
            ? "Concluído"
            : `Parcela ${currentInstallment} de ${inst.totalInstallments}`}
        </span>
        <span>{fmt(inst.installmentAmount)}/mês</span>
      </div>

      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all ${muted ? "bg-text-muted" : "bg-accent"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">
          Saldo:{" "}
          <span className={muted ? "text-text-muted" : "text-danger font-medium"}>
            {fmt(outstandingBalance)}
          </span>
        </span>
        {inst.dueDay && (
          <span className="text-text-muted">Vence dia {inst.dueDay}</span>
        )}
      </div>
    </div>
  )
}

function RegisterPaymentModal({
  installment,
  onClose,
  onPaid,
}: {
  installment: InstallmentData
  onClose: () => void
  onPaid: (updated: InstallmentData) => void
}) {
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])
  const [accountId, setAccountId] = useState("")
  const [amount, setAmount] = useState(String(installment.installmentAmount))
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const currentInstallment = installment.paidInstallments + 1

  useEffect(() => {
    fetch("/api/financas/accounts")
      .then((r) => r.json())
      .then((data: Array<{ id: string; name: string }>) => {
        setAccounts(data)
        if (data.length > 0) setAccountId(data[0].id)
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId) { setError("Selecione uma conta."); return }
    setSaving(true)
    try {
      const res = await fetch("/api/financas/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "EXPENSE",
          amount: Number(amount),
          date,
          description: `${installment.name} — parcela ${currentInstallment}/${installment.totalInstallments}`,
          accountId,
          categoryId: null,
          recurrence: "NONE",
          installmentId: installment.id,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao registrar")

      const newPaid = installment.paidInstallments + 1
      onPaid({
        ...installment,
        paidInstallments: newPaid,
        status: newPaid >= installment.totalInstallments ? "COMPLETED" : "ACTIVE",
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao registrar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-surface border border-border rounded-[var(--radius)] w-full max-w-sm"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-medium text-text text-sm">Registrar pagamento</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {installment.name} — parcela {currentInstallment}/{installment.totalInstallments}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-text-muted hover:bg-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Conta *</label>
            {accounts.length > 0 ? (
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-text-muted italic">Carregando contas...</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">Valor (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">Data *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              required
            />
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
              disabled={saving || !accountId}
              className="flex-1 py-2.5 text-sm bg-accent text-white font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {saving ? "Registrando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
