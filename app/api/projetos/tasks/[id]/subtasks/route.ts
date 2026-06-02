import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id: taskId } = await params
  const { title } = await req.json()
  if (!title) return Response.json({ error: "Título obrigatório" }, { status: 400 })

  const subtask = await db.subtask.create({ data: { taskId, title } })
  return Response.json(subtask, { status: 201 })
}
