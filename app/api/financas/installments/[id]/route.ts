import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

function serialize(i: {
  id: string
  name: string
  store: string | null
  totalAmount: unknown
  installmentAmount: unknown
  totalInstallments: number
  paidInstallments: number
  dueDay: number | null
  startDate: Date
  status: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...i,
    totalAmount: Number(i.totalAmount),
    installmentAmount: Number(i.installmentAmount),
    startDate: i.startDate.toISOString(),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { name, store, totalAmount, installmentAmount, totalInstallments, paidInstallments, dueDay, startDate, status } =
    await req.json()

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (store !== undefined) data.store = store || null
  if (totalAmount !== undefined) data.totalAmount = Number(totalAmount)
  if (installmentAmount !== undefined) data.installmentAmount = Number(installmentAmount)
  if (totalInstallments !== undefined) data.totalInstallments = Number(totalInstallments)
  if (paidInstallments !== undefined) data.paidInstallments = Number(paidInstallments)
  if (dueDay !== undefined) data.dueDay = dueDay ? Number(dueDay) : null
  if (startDate !== undefined) data.startDate = new Date(startDate)
  if (status !== undefined) data.status = status

  const installment = await db.installment.update({ where: { id }, data })

  return Response.json(serialize(installment))
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  await db.transaction.updateMany({
    where: { installmentId: id },
    data: { installmentId: null },
  })

  await db.installment.delete({ where: { id } })
  return Response.json({ ok: true })
}
