"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Check, X } from "lucide-react"

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export type MonthlyPaymentData = {
  id: string
  name: string
  amount: number
  dueDay: number | null
  mei: boolean
  paidThisMonth: boolean
  transactionId: string | null
}

export function MonthlyPaymentsSection({
  initialPayments,
}: {
  initialPayments: MonthlyPaymentData[]
}) {
  const [payments, setPayments] = useState<MonthlyPaymentData[]>(initialPayments)
  const [addOpen, setAddOpen] = useState(false)
  const [markingPaid, setMarkingPaid] = useState<MonthlyPaymentData | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("Excluir este pagamento?")) return
    const res = await fetch(`/api/financas/monthly-payments/${id}`, { method: "DELETE" })
    if (res.ok) {
      setPayments((prev) => prev.filter((p) => p.id !== id))
    }
  }

  function handleAdded(payment: MonthlyPaymentData) {
    setPayments((prev) => [...prev, payment])
    setAddOpen(false)
  }

  function handlePaid(updated: MonthlyPaymentData) {
    setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    setMarkingPaid(null)
  }

  const totalExpected = payments.reduce((s, p) => s + p.amount, 0)
  const totalReceived = payments.filter((p) => p.paidThisMonth).reduce((s, p) => s + p.amount, 0)
  const pending = payments.filter((p) => !p.paidThisMonth)
  const paid = payments.filter((p) => p.paidThisMonth)

  return (
    <>
      <div
        className="bg-surface border border-border rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-medium text-text">Receitas mensais</h2>
            {payments.length > 0 && (
              <p className="text-xs text-text-muted mt-0.5">
                Recebido:{" "}
                <span className="text-success font-medium">{fmt(totalReceived)}</span>
                {" "}de{" "}
                <span className="font-medium">{fmt(totalExpected)}</span>
              </p>
            )}
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent text-white font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover transition-colors"
          >
            <Plus size={12} /> Novo
          </button>
        </div>

        {payments.length === 0 ? (
          <p className="text-text-muted text-sm">
            Nenhuma receita mensal.{" "}
            <button onClick={() => setAddOpen(true)} className="text-accent hover:underline">
              Adicionar
            </button>
          </p>
        ) : (
          <div className="space-y-2">
            {pending.map((p) => (
              <PaymentRow
                key={p.id}
                payment={p}
                onDelete={() => handleDelete(p.id)}
                onMarkPaid={() => setMarkingPaid(p)}
              />
            ))}

            {paid.length > 0 && (
              <>
                {pending.length > 0 && <hr className="border-border" />}
                <p className="text-xs text-text-muted font-medium uppercase tracking-wide">
                  Recebidos
                </p>
                {paid.map((p) => (
                  <PaymentRow
                    key={p.id}
                    payment={p}
                    onDelete={() => handleDelete(p.id)}
                    muted
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {addOpen && (
        <AddPaymentModal onClose={() => setAddOpen(false)} onAdded={handleAdded} />
      )}

      {markingPaid && (
        <MarkPaidModal
          payment={markingPaid}
          onClose={() => setMarkingPaid(null)}
          onPaid={handlePaid}
        />
      )}
    </>
  )
}

function PaymentRow({
  payment,
  onDelete,
  onMarkPaid,
  muted = false,
}: {
  payment: MonthlyPaymentData
  onDelete: () => void
  onMarkPaid?: () => void
  muted?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-[var(--radius-sm)] border border-border px-3 py-2.5 ${muted ? "opacity-50" : ""}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-text truncate">{payment.name}</p>
          {payment.mei && (
            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-soft text-accent">
              MEI
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted">
          {fmt(payment.amount)}
          {payment.dueDay ? ` · vence dia ${payment.dueDay}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-3">
        {muted ? (
          <span className="flex items-center gap-1 text-xs text-success font-medium px-2 py-1">
            <Check size={12} /> Pago
          </span>
        ) : (
          onMarkPaid && (
            <button
              onClick={onMarkPaid}
              className="flex items-center gap-1 px-2 py-1 text-xs text-success border border-success/30 rounded-[var(--radius-sm)] hover:bg-success/10 transition-colors"
            >
              <Check size={12} /> Recebido
            </button>
          )
        )}
        <button
          onClick={onDelete}
          className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-surface-2 transition-colors"
          title="Excluir"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

function AddPaymentModal({
  onClose,
  onAdded,
}: {
  onClose: () => void
  onAdded: (p: MonthlyPaymentData) => void
}) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDay, setDueDay] = useState("")
  const [mei, setMei] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/financas/monthly-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount: Number(amount),
          dueDay: dueDay ? Number(dueDay) : null,
          mei,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao salvar")
      const data = await res.json()
      onAdded({ ...data, paidThisMonth: false, transactionId: null })
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
        className="relative bg-surface border border-border rounded-[var(--radius)] w-full max-w-sm"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-medium text-text text-sm">Nova receita mensal</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-text-muted hover:bg-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Salário, Freelance..."
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              required
              autoFocus
            />
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
            <label className="block text-xs text-text-muted mb-1">Dia do mês (opcional)</label>
            <input
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              placeholder="Ex.: 5"
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={mei}
              onChange={(e) => setMei(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-[var(--accent)]"
            />
            <span className="text-sm text-text">Declarado no MEI</span>
          </label>

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
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MarkPaidModal({
  payment,
  onClose,
  onPaid,
}: {
  payment: MonthlyPaymentData
  onClose: () => void
  onPaid: (updated: MonthlyPaymentData) => void
}) {
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])
  const [accountId, setAccountId] = useState("")
  const [amount, setAmount] = useState(String(payment.amount))
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

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
          type: "INCOME",
          amount: Number(amount),
          date,
          description: payment.name,
          accountId,
          categoryId: null,
          recurrence: "NONE",
          monthlyPaymentId: payment.id,
          mei: payment.mei,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao registrar")
      const tx = await res.json()
      onPaid({ ...payment, paidThisMonth: true, transactionId: tx.id })
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
            <h2 className="font-medium text-text text-sm">Marcar como recebido</h2>
            <p className="text-xs text-text-muted mt-0.5">{payment.name}</p>
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
              className="flex-1 py-2.5 text-sm bg-success text-white font-medium rounded-[var(--radius-sm)] hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Registrando..." : "Confirmar recebimento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
