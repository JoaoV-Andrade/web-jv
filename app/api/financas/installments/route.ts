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

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  const installments = await db.installment.findMany({
    where: status ? { status: status as "ACTIVE" | "COMPLETED" | "CANCELLED" } : undefined,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })

  return Response.json(installments.map(serialize))
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { name, store, totalAmount, installmentAmount, totalInstallments, dueDay, startDate } =
    await req.json()

  if (!name || !totalAmount || !installmentAmount || !totalInstallments || !startDate) {
    return Response.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }

  const installment = await db.installment.create({
    data: {
      name,
      store: store || null,
      totalAmount: Number(totalAmount),
      installmentAmount: Number(installmentAmount),
      totalInstallments: Number(totalInstallments),
      dueDay: dueDay ? Number(dueDay) : null,
      startDate: new Date(startDate),
    },
  })

  return Response.json(serialize(installment), { status: 201 })
}
