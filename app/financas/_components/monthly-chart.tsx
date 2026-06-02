"use client"

type MonthData = { label: string; income: number; expense: number }

export function MonthlyChart({ data }: { data: MonthData[] }) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1)
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div
      className="bg-surface border border-border rounded-[var(--radius)] p-5"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <h2 className="font-medium text-text mb-4">Últimos 6 meses</h2>

      <div className="flex items-end gap-3 h-36">
        {data.map((d) => (
          <div key={d.label} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div className="flex items-end gap-0.5 w-full justify-center h-28">
              <div
                title={`Receitas: ${fmt(d.income)}`}
                className="bg-success rounded-t-sm flex-1 transition-all cursor-default"
                style={{
                  height: `${(d.income / max) * 100}%`,
                  minHeight: d.income > 0 ? "3px" : "0",
                  opacity: d.income > 0 ? 1 : 0.15,
                }}
              />
              <div
                title={`Despesas: ${fmt(d.expense)}`}
                className="bg-danger rounded-t-sm flex-1 transition-all cursor-default"
                style={{
                  height: `${(d.expense / max) * 100}%`,
                  minHeight: d.expense > 0 ? "3px" : "0",
                  opacity: d.expense > 0 ? 1 : 0.15,
                }}
              />
            </div>
            <span className="text-xs text-text-muted capitalize truncate w-full text-center">
              {d.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-3 justify-end">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-success" />
          <span className="text-xs text-text-muted">Receitas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-danger" />
          <span className="text-xs text-text-muted">Despesas</span>
        </div>
      </div>
    </div>
  )
}
