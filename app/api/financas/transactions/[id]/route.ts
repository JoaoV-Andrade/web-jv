import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { type, amount, date, description, accountId, categoryId, recurrence } = await req.json()

  const transaction = await db.transaction.update({
    where: { id },
    data: {
      type,
      amount,
      date: new Date(date),
      description: description || null,
      accountId,
      categoryId: categoryId || null,
      recurrence: recurrence || "NONE",
    },
    include: { account: true, category: true },
  })

  return Response.json({
    ...transaction,
    amount: Number(transaction.amount),
    date: transaction.date.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.transaction.delete({ where: { id } })
  return Response.json({ ok: true })
}
