import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { type, amount, date, description, accountId, categoryId, recurrence, installmentId, mei } =
    await req.json()

  const current = await db.transaction.findUnique({
    where: { id },
    select: { installmentId: true },
  })

  const oldInstallmentId = current?.installmentId ?? null
  const newInstallmentId = installmentId || null

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
      installmentId: newInstallmentId,
      mei: type === "INCOME" ? !!mei : false,
    },
    include: { account: true, category: true },
  })

  if (oldInstallmentId !== newInstallmentId) {
    if (oldInstallmentId) {
      const old = await db.installment.findUnique({ where: { id: oldInstallmentId } })
      if (old) {
        const newPaid = Math.max(0, old.paidInstallments - 1)
        await db.installment.update({
          where: { id: oldInstallmentId },
          data: { paidInstallments: newPaid, status: newPaid < old.totalInstallments ? "ACTIVE" : "COMPLETED" },
        })
      }
    }
    if (newInstallmentId) {
      const inst = await db.installment.findUnique({ where: { id: newInstallmentId } })
      if (inst) {
        const newPaid = inst.paidInstallments + 1
        await db.installment.update({
          where: { id: newInstallmentId },
          data: { paidInstallments: newPaid, status: newPaid >= inst.totalInstallments ? "COMPLETED" : "ACTIVE" },
        })
      }
    }
  }

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

  const tx = await db.transaction.findUnique({ where: { id }, select: { installmentId: true } })
  await db.transaction.delete({ where: { id } })

  if (tx?.installmentId) {
    const inst = await db.installment.findUnique({ where: { id: tx.installmentId } })
    if (inst) {
      const newPaid = Math.max(0, inst.paidInstallments - 1)
      await db.installment.update({
        where: { id: tx.installmentId },
        data: { paidInstallments: newPaid, status: newPaid < inst.totalInstallments ? "ACTIVE" : "COMPLETED" },
      })
    }
  }

  return Response.json({ ok: true })
}
