import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AppShell } from "@/components/app-shell"
import { SummaryCards } from "./_components/summary-cards"
import { MonthlyChart } from "./_components/monthly-chart"
import { BudgetProgress } from "./_components/budget-progress"
import { InstallmentsSection } from "./_components/installments-section"
import Link from "next/link"

const fmtDate = (d: Date) =>
  d.toISOString().slice(0, 10).split("-").reverse().join("/")

export default async function FinancasPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const pad = (n: number) => String(n).padStart(2, "0")
  const monthStart = new Date(`${year}-${pad(month)}-01T00:00:00.000Z`)
  const monthEnd = month === 12
    ? new Date(`${year + 1}-01-01T00:00:00.000Z`)
    : new Date(`${year}-${pad(month + 1)}-01T00:00:00.000Z`)

  // Summary do mês atual
  const [incomeAgg, expenseAgg] = await Promise.all([
    db.transaction.aggregate({
      where: { type: "INCOME", date: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { type: "EXPENSE", date: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
  ])

  const monthIncome = Number(incomeAgg._sum.amount ?? 0)
  const monthExpense = Number(expenseAgg._sum.amount ?? 0)

  // Últimos 6 meses
  const sixMonthsAgo = new Date(`${year}-${pad(month)}-01T00:00:00.000Z`)
  sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 6)
  const historicTxns = await db.transaction.findMany({
    where: { date: { gte: sixMonthsAgo, lt: monthEnd } },
    select: { type: true, amount: true, date: true },
  })

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i
    const m = ((month - 1 - offset) % 12 + 12) % 12 + 1
    const y = year + Math.floor((month - 1 - offset) / 12)
    const mStart = new Date(`${y}-${pad(m)}-01T00:00:00.000Z`)
    const mEnd = m === 12
      ? new Date(`${y + 1}-01-01T00:00:00.000Z`)
      : new Date(`${y}-${pad(m + 1)}-01T00:00:00.000Z`)
    const txns = historicTxns.filter((t) => t.date >= mStart && t.date < mEnd)
    const label = new Date(`${y}-${pad(m)}-15T12:00:00.000Z`).toLocaleString("pt-BR", { month: "short" })
    return {
      label,
      income: txns.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0),
      expense: txns.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0),
    }
  })

  // Orçamentos do mês
  const budgets = await db.budget.findMany({
    where: { month, year },
    include: { category: true },
  })

  const budgetData = await Promise.all(
    budgets.map(async (b) => {
      const agg = await db.transaction.aggregate({
        where: {
          type: "EXPENSE",
          categoryId: b.categoryId,
          date: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
      })
      return {
        id: b.id,
        category: b.category.name,
        budgeted: Number(b.amount),
        spent: Number(agg._sum.amount ?? 0),
      }
    })
  )

  // Parcelamentos
  const installmentsRaw = await db.installment.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })
  const installmentData = installmentsRaw.map((i) => ({
    id: i.id,
    name: i.name,
    store: i.store,
    totalAmount: Number(i.totalAmount),
    installmentAmount: Number(i.installmentAmount),
    totalInstallments: i.totalInstallments,
    paidInstallments: i.paidInstallments,
    dueDay: i.dueDay,
    startDate: i.startDate.toISOString(),
    status: i.status as string,
  }))

  // Últimas transações
  const recent = await db.transaction.findMany({
    take: 5,
    orderBy: { date: "desc" },
    include: { account: true, category: true },
  })

  return (
    <AppShell>
      <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl text-text">Finanças</h1>
            <p className="text-text-muted text-sm mt-0.5 capitalize">
              {now.toLocaleString("pt-BR", { month: "long", year: "numeric" })}
            </p>
          </div>
          <Link
            href="/financas/transacoes"
            className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover transition-colors"
          >
            Transações
          </Link>
        </div>

        <SummaryCards income={monthIncome} expense={monthExpense} />

        <MonthlyChart data={monthlyData} />

        {budgetData.length > 0 && <BudgetProgress budgets={budgetData} />}

        <InstallmentsSection initialInstallments={installmentData} />

        {/* Últimas transações */}
        <div
          className="bg-surface border border-border rounded-[var(--radius)] p-5"
          style={{ boxShadow: "var(--shadow)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-text">Últimas transações</h2>
            <Link href="/financas/transacoes" className="text-xs text-accent hover:text-accent-hover">
              Ver todas →
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="text-text-muted text-sm">
              Nenhuma transação ainda.{" "}
              <Link href="/financas/transacoes" className="text-accent hover:underline">
                Adicionar
              </Link>
            </p>
          ) : (
            <div className="space-y-0">
              {recent.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between py-2.5 ${
                    i < recent.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        t.type === "INCOME" ? "bg-success" : "bg-danger"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-text truncate">
                        {t.description || t.account.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {t.category && <span className="mr-2">{t.category.name}</span>}
                        {fmtDate(t.date)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-medium shrink-0 ml-4 ${
                      t.type === "INCOME" ? "text-success" : "text-danger"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "−"}
                    {Number(t.amount).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
