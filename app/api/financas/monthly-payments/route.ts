import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

function serialize(p: {
  id: string
  name: string
  amount: unknown
  dueDay: number | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...p,
    amount: Number(p.amount),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const payments = await db.monthlyPayment.findMany({
    orderBy: { createdAt: "asc" },
  })

  return Response.json(payments.map(serialize))
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { name, amount, dueDay } = await req.json()

  if (!name || !amount) {
    return Response.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }

  const payment = await db.monthlyPayment.create({
    data: {
      name,
      amount: Number(amount),
      dueDay: dueDay ? Number(dueDay) : null,
    },
  })

  return Response.json(serialize(payment), { status: 201 })
}
