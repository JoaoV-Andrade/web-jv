import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get("month")
  const year = searchParams.get("year")
  const type = searchParams.get("type")

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

  if (type === "INCOME" || type === "EXPENSE") {
    where.type = type
  }

  const transactions = await db.transaction.findMany({
    where,
    include: { account: true, category: true },
    orderBy: { date: "desc" },
  })

  return Response.json(
    transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))
  )
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { type, amount, date, description, accountId, categoryId, recurrence, installmentId, monthlyPaymentId, mei } =
    await req.json()

  if (!type || !amount || !date || !accountId) {
    return Response.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }

  const transaction = await db.transaction.create({
    data: {
      type,
      amount,
      date: new Date(date),
      description: description || null,
      accountId,
      categoryId: categoryId || null,
      recurrence: recurrence || "NONE",
      installmentId: installmentId || null,
      monthlyPaymentId: monthlyPaymentId || null,
      mei: type === "INCOME" ? !!mei : false,
    },
    include: { account: true, category: true },
  })

  if (installmentId) {
    const inst = await db.installment.findUnique({ where: { id: installmentId } })
    if (inst) {
      const newPaid = inst.paidInstallments + 1
      await db.installment.update({
        where: { id: installmentId },
        data: {
          paidInstallments: newPaid,
          status: newPaid >= inst.totalInstallments ? "COMPLETED" : "ACTIVE",
        },
      })
    }
  }

  return Response.json(
    {
      ...transaction,
      amount: Number(transaction.amount),
      date: transaction.date.toISOString(),
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    },
    { status: 201 }
  )
}
