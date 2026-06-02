import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const accounts = await db.financialAccount.findMany({ orderBy: { createdAt: "asc" } })
  return Response.json(accounts)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { name, type } = await req.json()
  if (!name || !type) return Response.json({ error: "Campos obrigatórios faltando" }, { status: 400 })

  const account = await db.financialAccount.create({ data: { name, type } })
  return Response.json(account, { status: 201 })
}
