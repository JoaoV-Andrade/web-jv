import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const categories = await db.category.findMany({ orderBy: { name: "asc" } })
  return Response.json(categories)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { name, color, icon } = await req.json()
  if (!name) return Response.json({ error: "Nome obrigatório" }, { status: 400 })

  const category = await db.category.create({ data: { name, color: color || null, icon: icon || null } })
  return Response.json(category, { status: 201 })
}
