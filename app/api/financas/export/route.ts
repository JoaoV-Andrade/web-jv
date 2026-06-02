import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get("month")
  const year = searchParams.get("year")

  const where: Record<string, unknown> = {}
  if (month && year) {
    const m = Number(month)
    const y = Number(year)
    const pad = (n: number) => String(n).padStart(2, "0")
    const start = new Date(`${y}-${pad(m)}-01T00:00:00.000Z`)
    const end = m === 12
      ? new Date(`${y + 1}-01-01T00:00:00.000Z`)
      : new Date(`${y}-${pad(m + 1)}-01T00:00:00.000Z`)
    where.date = { gte: start, lt: end }
  }

  const transactions = await db.transaction.findMany({
    where,
    include: { account: true, category: true },
    orderBy: { date: "desc" },
  })

  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`
  const header = "Data,Tipo,Valor,Descrição,Conta,Categoria,Recorrência"
  const rows = transactions.map((t) =>
    [
      t.date.toISOString().slice(0, 10).split("-").reverse().join("/"),
      t.type === "INCOME" ? "Receita" : "Despesa",
      Number(t.amount).toFixed(2).replace(".", ","),
      escape(t.description ?? ""),
      escape(t.account.name),
      escape(t.category?.name ?? ""),
      t.recurrence,
    ].join(",")
  )

  const csv = [header, ...rows].join("\n")
  const suffix = month && year ? `_${year}-${String(month).padStart(2, "0")}` : ""

  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transacoes${suffix}.csv"`,
    },
  })
}
