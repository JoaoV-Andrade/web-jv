import Link from "next/link"

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

type Props = {
  configured: boolean
  year: number
  yearIncome: number
  yearLimit: number
  monthIncome: number
  monthlyLimit: number
}

export function MeiSection({ configured, year, yearIncome, yearLimit, monthIncome, monthlyLimit }: Props) {
  const pct = yearLimit > 0 ? (yearIncome / yearLimit) * 100 : 0
  const remaining = yearLimit - yearIncome
  const barColor = pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-warning" : "bg-success"
  const monthOver = monthIncome > monthlyLimit

  return (
    <div
      className="bg-surface border border-border rounded-[var(--radius)] p-5"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-text">MEI · faturamento {year}</h2>
        <Link href="/financas/mei" className="text-xs text-accent hover:text-accent-hover">
          Detalhes →
        </Link>
      </div>

      {!configured ? (
        <p className="text-text-muted text-sm">
          Configure a abertura do MEI para acompanhar o limite de faturamento.{" "}
          <Link href="/financas/mei" className="text-accent hover:underline">
            Configurar MEI
          </Link>
        </p>
      ) : (
        <div className="space-y-4">
          {/* Progresso anual */}
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-text">
                {fmt(yearIncome)} de {fmt(yearLimit)}
              </span>
              <span className={pct >= 90 ? "text-danger font-medium" : "text-text-muted"}>
                {pct.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <p className={`text-xs mt-1.5 ${remaining < 0 ? "text-danger font-medium" : "text-text-muted"}`}>
              {remaining >= 0
                ? `Faltam ${fmt(remaining)} para o limite do ano`
                : `Limite estourado em ${fmt(-remaining)}`}
            </p>
          </div>

          {/* Ritmo mensal */}
          <div className="flex justify-between text-sm pt-1 border-t border-border">
            <span className="text-text-muted">Este mês</span>
            <span className={monthOver ? "text-warning font-medium" : "text-text"}>
              {fmt(monthIncome)} / {fmt(monthlyLimit)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
