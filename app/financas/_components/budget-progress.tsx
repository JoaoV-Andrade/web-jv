type Budget = {
  id: string
  category: string
  budgeted: number
  spent: number
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function BudgetProgress({ budgets }: { budgets: Budget[] }) {
  return (
    <div
      className="bg-surface border border-border rounded-[var(--radius)] p-5"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <h2 className="font-medium text-text mb-4">Orçamentos do mês</h2>
      <div className="space-y-4">
        {budgets.map((b) => {
          const pct = Math.min((b.spent / b.budgeted) * 100, 100)
          const over = b.spent > b.budgeted
          return (
            <div key={b.id}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-text">{b.category}</span>
                <span className={over ? "text-danger font-medium" : "text-text-muted"}>
                  {fmt(b.spent)} / {fmt(b.budgeted)}
                </span>
              </div>
              <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${over ? "bg-danger" : "bg-accent"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
