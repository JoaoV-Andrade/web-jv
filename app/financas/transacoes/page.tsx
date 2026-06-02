"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { TransactionModal } from "../_components/transaction-modal"
import { Plus, Download, ChevronLeft, ChevronRight, Pencil, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"

type Account = { id: string; name: string; type: string }
type Category = { id: string; name: string; color: string | null }
type Transaction = {
  id: string
  type: "INCOME" | "EXPENSE"
  amount: number
  date: string
  description: string | null
  accountId: string
  account: Account
  categoryId: string | null
  category: Category | null
  recurrence: string
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const fmtDate = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/")

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
]

export default function TransacoesPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL")

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ month: String(month), year: String(year) })
    if (typeFilter !== "ALL") params.set("type", typeFilter)

    const [txRes, accRes, catRes] = await Promise.all([
      fetch(`/api/financas/transactions?${params}`),
      fetch("/api/financas/accounts"),
      fetch("/api/financas/categories"),
    ])

    if (txRes.ok) setTransactions(await txRes.json())
    if (accRes.ok) setAccounts(await accRes.json())
    if (catRes.ok) setCategories(await catRes.json())
    setLoading(false)
  }, [month, year, typeFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta transação?")) return
    await fetch(`/api/financas/transactions/${id}`, { method: "DELETE" })
    fetchAll()
  }

  function handleExport() {
    window.location.href = `/api/financas/export?month=${month}&year=${year}`
  }

  const income = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0)

  return (
    <AppShell>
      <div className="max-w-5xl space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Link
              href="/financas"
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text mb-1"
            >
              <ArrowLeft size={12} /> Finanças
            </Link>
            <h1 className="font-serif text-3xl text-text">Transações</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted border border-border rounded-[var(--radius-sm)] hover:bg-surface-2 transition-colors"
            >
              <Download size={14} /> CSV
            </button>
            <button
              onClick={() => { setEditing(null); setModalOpen(true) }}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-accent text-white font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover transition-colors"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Month navigator */}
          <div className="flex items-center gap-1 bg-surface border border-border rounded-[var(--radius-sm)] px-1">
            <button
              onClick={prevMonth}
              className="p-2 text-text-muted hover:text-text transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-text min-w-32 text-center font-medium">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 text-text-muted hover:text-text transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Type filter */}
          <div className="flex gap-1 bg-surface border border-border rounded-[var(--radius-sm)] p-1">
            {([["ALL", "Todas"], ["INCOME", "Receitas"], ["EXPENSE", "Despesas"]] as const).map(
              ([v, l]) => (
                <button
                  key={v}
                  onClick={() => setTypeFilter(v)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                    typeFilter === v
                      ? "bg-accent-soft text-accent"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  {l}
                </button>
              )
            )}
          </div>
        </div>

        {/* Summary row */}
        {!loading && transactions.length > 0 && (
          <div className="flex gap-4 text-sm">
            <span className="text-text-muted">
              Receitas: <span className="text-success font-medium">{fmt(income)}</span>
            </span>
            <span className="text-text-muted">
              Despesas: <span className="text-danger font-medium">{fmt(expense)}</span>
            </span>
            <span className="text-text-muted">
              Saldo:{" "}
              <span className={`font-medium ${income - expense >= 0 ? "text-success" : "text-danger"}`}>
                {income - expense >= 0 ? "+" : ""}{fmt(income - expense)}
              </span>
            </span>
          </div>
        )}

        {/* Table */}
        <div
          className="bg-surface border border-border rounded-[var(--radius)] overflow-hidden"
          style={{ boxShadow: "var(--shadow)" }}
        >
          {loading ? (
            <div className="p-8 text-center text-text-muted text-sm">Carregando...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-text-muted text-sm mb-3">Nenhuma transação neste período.</p>
              <button
                onClick={() => { setEditing(null); setModalOpen(true) }}
                className="text-sm text-accent hover:text-accent-hover"
              >
                + Adicionar primeira transação
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted hidden sm:table-cell">Categoria</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted hidden md:table-cell">Conta</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Valor</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr
                    key={t.id}
                    className={`border-b border-border last:border-0 hover:bg-surface-2 transition-colors ${
                      i % 2 === 0 ? "" : "bg-surface"
                    }`}
                  >
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {fmtDate(t.date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            t.type === "INCOME" ? "bg-success" : "bg-danger"
                          }`}
                        />
                        <span className="text-text truncate max-w-40">
                          {t.description || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted hidden sm:table-cell">
                      {t.category?.name ?? <span className="text-border">—</span>}
                    </td>
                    <td className="px-4 py-3 text-text-muted hidden md:table-cell">
                      {t.account.name}
                    </td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      <span className={t.type === "INCOME" ? "text-success" : "text-danger"}>
                        {t.type === "INCOME" ? "+" : "−"}{fmt(t.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => { setEditing(t); setModalOpen(true) }}
                          className="p-1.5 rounded text-text-muted hover:text-text hover:bg-surface transition-colors"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-surface transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <TransactionModal
          transaction={editing ?? undefined}
          accounts={accounts}
          categories={categories}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); fetchAll() }}
          onAccountCreated={(a) => setAccounts((prev) => [...prev, a])}
          onCategoryCreated={(c) => setCategories((prev) => [...prev, c])}
        />
      )}
    </AppShell>
  )
}
