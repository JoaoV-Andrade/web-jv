import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AppShell } from "@/components/app-shell"
import { MeiSettingsForm } from "./_components/mei-settings-form"
import { meiLimitForYear } from "@/lib/mei"
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import Link from "next/link"

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const fmtDate = (d: Date) => d.toISOString().slice(0, 10).split("-").reverse().join("/")

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
]

export default async function MeiPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const { year: yearParam } = await searchParams
  const year = Number(yearParam) || new Date().getFullYear()

  const pad = (n: number) => String(n).padStart(2, "0")
  const yearStart = new Date(`${year}-01-01T00:00:00.000Z`)
  const yearEnd = new Date(`${year + 1}-01-01T00:00:00.000Z`)

  const [meiSettingsRaw, txns] = await Promise.all([
    db.meiSettings.findFirst(),
    db.transaction.findMany({
      where: { type: "INCOME", mei: true, date: { gte: yearStart, lt: yearEnd } },
      include: { account: true },
      orderBy: { date: "desc" },
    }),
  ])

  const meiSettings = meiSettingsRaw
    ? {
        openingMonth: meiSettingsRaw.openingMonth,
        openingYear: meiSettingsRaw.openingYear,
        annualLimit: Number(meiSettingsRaw.annualLimit),
        monthlyLimit: Number(meiSettingsRaw.monthlyLimit),
      }
    : null

  const monthlyLimit = meiSettings?.monthlyLimit ?? 6750
  const yearLimit = meiLimitForYear(meiSettings, year)
  const yearIncome = txns.reduce((s, t) => s + Number(t.amount), 0)
  const pct = yearLimit > 0 ? (yearIncome / yearLimit) * 100 : 0
  const remaining = yearLimit - yearIncome
  const barColor = pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-warning" : "bg-success"

  // Quebra mês a mês
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const mStart = new Date(`${year}-${pad(i + 1)}-01T00:00:00.000Z`)
    const mEnd = i === 11
      ? new Date(`${year + 1}-01-01T00:00:00.000Z`)
      : new Date(`${year}-${pad(i + 2)}-01T00:00:00.000Z`)
    const total = txns
      .filter((t) => t.date >= mStart && t.date < mEnd)
      .reduce((s, t) => s + Number(t.amount), 0)
    return { label: MONTH_LABELS[i], total }
  })
  const maxMonth = Math.max(...monthly.map((m) => m.total), monthlyLimit, 1)

  return (
    <AppShell>
      <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/financas"
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text mb-1"
            >
              <ArrowLeft size={12} /> Finanças
            </Link>
            <h1 className="font-serif text-3xl text-text">MEI</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/financas/mei?year=${year - 1}`}
              className="p-2 border border-border rounded-[var(--radius-sm)] text-text-muted hover:bg-surface-2 transition-colors"
            >
              <ChevronLeft size={16} />
            </Link>
            <span className="text-sm text-text font-medium w-12 text-center">{year}</span>
            <Link
              href={`/financas/mei?year=${year + 1}`}
              className="p-2 border border-border rounded-[var(--radius-sm)] text-text-muted hover:bg-surface-2 transition-colors"
            >
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Progresso anual */}
        <div
          className="bg-surface border border-border rounded-[var(--radius)] p-5"
          style={{ boxShadow: "var(--shadow)" }}
        >
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-sm text-text-muted">Faturamento declarado {year}</span>
            <span className={`text-sm font-medium ${pct >= 90 ? "text-danger" : "text-text-muted"}`}>
              {pct.toFixed(0)}%
            </span>
          </div>
          <p className="text-2xl font-semibold text-text mb-3">
            {fmt(yearIncome)} <span className="text-base font-normal text-text-muted">de {fmt(yearLimit)}</span>
          </p>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <p className={`text-xs mt-2 ${remaining < 0 ? "text-danger font-medium" : "text-text-muted"}`}>
            {remaining >= 0
              ? `Faltam ${fmt(remaining)} para o limite do ano`
              : `Limite estourado em ${fmt(-remaining)}`}
          </p>
        </div>

        {/* Quebra mês a mês */}
        <div
          className="bg-surface border border-border rounded-[var(--radius)] p-5"
          style={{ boxShadow: "var(--shadow)" }}
        >
          <h2 className="font-medium text-text mb-4">Faturamento por mês · teto {fmt(monthlyLimit)}</h2>
          <div className="space-y-2.5">
            {monthly.map((m) => {
              const over = m.total > monthlyLimit
              const w = (m.total / maxMonth) * 100
              return (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-8 shrink-0">{m.label}</span>
                  <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${over ? "bg-warning" : "bg-success"}`}
                      style={{ width: `${w}%`, minWidth: m.total > 0 ? "3px" : "0" }}
                    />
                  </div>
                  <span className={`text-xs w-24 text-right shrink-0 ${over ? "text-warning font-medium" : "text-text-muted"}`}>
                    {fmt(m.total)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Configuração */}
        <MeiSettingsForm initial={meiSettings} />

        {/* Transações declaradas */}
        <div
          className="bg-surface border border-border rounded-[var(--radius)] p-5"
          style={{ boxShadow: "var(--shadow)" }}
        >
          <h2 className="font-medium text-text mb-4">Recebimentos declarados em {year}</h2>
          {txns.length === 0 ? (
            <p className="text-text-muted text-sm">
              Nenhum recebimento marcado como MEI neste ano. Marque a opção &quot;Declarado no MEI&quot; ao
              registrar uma receita.
            </p>
          ) : (
            <div className="space-y-0">
              {txns.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between py-2.5 ${
                    i < txns.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-text truncate">{t.description || t.account.name}</p>
                    <p className="text-xs text-text-muted">{fmtDate(t.date)}</p>
                  </div>
                  <span className="text-sm font-medium text-success shrink-0 ml-4">
                    +{fmt(Number(t.amount))}
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
