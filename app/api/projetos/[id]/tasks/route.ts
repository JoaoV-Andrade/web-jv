import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id: projectId } = await params
  const { title, description, priority, deadline, subtasks } = await req.json()
  if (!title) return Response.json({ error: "Título obrigatório" }, { status: 400 })

  const count = await db.task.count({ where: { projectId } })

  const task = await db.task.create({
    data: {
      projectId,
      title,
      description: description || null,
      priority: priority || "MEDIUM",
      deadline: deadline ? new Date(deadline) : null,
      position: count,
      subtasks: subtasks?.length
        ? { create: subtasks.map((s: string) => ({ title: s })) }
        : undefined,
    },
    include: { subtasks: { orderBy: { createdAt: "asc" } } },
  })

  return Response.json(
    {
      ...task,
      deadline: task.deadline?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    },
    { status: 201 }
  )
}
