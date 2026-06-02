const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

type Props = { income: number; expense: number }

export function SummaryCards({ income, expense }: Props) {
  const balance = income - expense
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card label="Receitas do mês" value={fmt(income)} color="text-success" />
      <Card label="Despesas do mês" value={fmt(expense)} color="text-danger" />
      <Card
        label="Saldo do mês"
        value={(balance >= 0 ? "+" : "") + fmt(balance)}
        color={balance >= 0 ? "text-success" : "text-danger"}
      />
    </div>
  )
}

function Card({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="bg-surface border border-border rounded-[var(--radius)] p-5"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className={`text-xl font-semibold ${color}`}>{value}</p>
    </div>
  )
}
