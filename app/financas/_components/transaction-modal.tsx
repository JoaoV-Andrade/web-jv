"use client"

import { useState, useEffect } from "react"
import { X, Plus } from "lucide-react"

type Account = { id: string; name: string; type: string }
type Category = { id: string; name: string; color: string | null }
type Transaction = {
  id: string
  type: "INCOME" | "EXPENSE"
  amount: number
  date: string
  description: string | null
  accountId: string
  categoryId: string | null
  recurrence: string
}

type Props = {
  transaction?: Transaction
  accounts: Account[]
  categories: Category[]
  onClose: () => void
  onSaved: () => void
  onAccountCreated: (a: Account) => void
  onCategoryCreated: (c: Category) => void
}

const RECURRENCE_LABELS: Record<string, string> = {
  NONE: "Sem recorrência",
  DAILY: "Diária",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  INVESTMENT: "Investimento",
  CASH: "Dinheiro",
  OTHER: "Outro",
}

export function TransactionModal({
  transaction,
  accounts,
  categories,
  onClose,
  onSaved,
  onAccountCreated,
  onCategoryCreated,
}: Props) {
  const isEditing = !!transaction

  const [type, setType] = useState<"INCOME" | "EXPENSE">(transaction?.type ?? "EXPENSE")
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "")
  const [date, setDate] = useState(transaction ? transaction.date.slice(0, 10) : new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState(transaction?.description ?? "")
  const [accountId, setAccountId] = useState(transaction?.accountId ?? accounts[0]?.id ?? "")
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "")
  const [recurrence, setRecurrence] = useState(transaction?.recurrence ?? "NONE")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [showNewAccount, setShowNewAccount] = useState(false)
  const [newAccName, setNewAccName] = useState("")
  const [newAccType, setNewAccType] = useState("CHECKING")
  const [savingAccount, setSavingAccount] = useState(false)

  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [savingCategory, setSavingCategory] = useState(false)

  useEffect(() => {
    if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id)
  }, [accounts, accountId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!accountId) { setError("Selecione uma conta."); return }
    if (!amount || Number(amount) <= 0) { setError("Valor inválido."); return }

    setSaving(true)
    try {
      const url = isEditing
        ? `/api/financas/transactions/${transaction.id}`
        : "/api/financas/transactions"
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: Number(amount),
          date,
          description: description || null,
          accountId,
          categoryId: categoryId || null,
          recurrence,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao salvar")
      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateAccount() {
    if (!newAccName.trim()) return
    setSavingAccount(true)
    try {
      const res = await fetch("/api/financas/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAccName.trim(), type: newAccType }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? "Erro ao criar conta")
        return
      }
      const acc: Account = await res.json()
      onAccountCreated(acc)
      setAccountId(acc.id)
      setShowNewAccount(false)
      setNewAccName("")
    } catch {
      setError("Erro ao criar conta")
    } finally {
      setSavingAccount(false)
    }
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return
    setSavingCategory(true)
    try {
      const res = await fetch("/api/financas/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? "Erro ao criar categoria")
        return
      }
      const cat: Category = await res.json()
      onCategoryCreated(cat)
      setCategoryId(cat.id)
      setShowNewCategory(false)
      setNewCatName("")
    } catch {
      setError("Erro ao criar categoria")
    } finally {
      setSavingCategory(false)
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
          <h2 className="font-medium text-text">
            {isEditing ? "Editar transação" : "Nova transação"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-text-muted hover:bg-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(["EXPENSE", "INCOME"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-[var(--radius-sm)] border transition-colors ${
                  type === t
                    ? t === "INCOME"
                      ? "bg-success text-white border-success"
                      : "bg-danger text-white border-danger"
                    : "border-border text-text-muted hover:bg-surface-2"
                }`}
              >
                {t === "INCOME" ? "Receita" : "Despesa"}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Valor (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              required
            />
          </div>

          {/* Date */}
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

          {/* Description */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Salário..."
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          {/* Account */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Conta *</label>
            {accounts.length > 0 ? (
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-text-muted italic">Nenhuma conta cadastrada.</p>
            )}
            <button
              type="button"
              onClick={() => setShowNewAccount(!showNewAccount)}
              className="mt-1.5 flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
            >
              <Plus size={12} /> Nova conta
            </button>
            {showNewAccount && (
              <div className="mt-2 p-3 bg-surface-2 rounded-[var(--radius-sm)] space-y-2">
                <input
                  type="text"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="Nome da conta"
                  className="w-full px-2.5 py-1.5 text-xs bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
                />
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
                >
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewAccount(false)}
                    className="flex-1 py-1.5 text-xs text-text-muted border border-border rounded-[var(--radius-sm)] hover:bg-bg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateAccount}
                    disabled={savingAccount || !newAccName.trim()}
                    className="flex-1 py-1.5 text-xs bg-accent text-white rounded-[var(--radius-sm)] hover:bg-accent-hover disabled:opacity-50"
                  >
                    {savingAccount ? "Criando..." : "Criar"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCategory(!showNewCategory)}
              className="mt-1.5 flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
            >
              <Plus size={12} /> Nova categoria
            </button>
            {showNewCategory && (
              <div className="mt-2 p-3 bg-surface-2 rounded-[var(--radius-sm)] space-y-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nome da categoria"
                  className="w-full px-2.5 py-1.5 text-xs bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(false)}
                    className="flex-1 py-1.5 text-xs text-text-muted border border-border rounded-[var(--radius-sm)] hover:bg-bg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={savingCategory || !newCatName.trim()}
                    className="flex-1 py-1.5 text-xs bg-accent text-white rounded-[var(--radius-sm)] hover:bg-accent-hover disabled:opacity-50"
                  >
                    {savingCategory ? "Criando..." : "Criar"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Recorrência</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
            >
              {Object.entries(RECURRENCE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          {/* Actions */}
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
