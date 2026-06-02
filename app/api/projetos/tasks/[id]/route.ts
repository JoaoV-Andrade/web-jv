import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { title, description, status, priority, deadline } = await req.json()

  const task = await db.task.update({
    where: { id },
    data: {
      title,
      description: description || null,
      status,
      priority,
      deadline: deadline ? new Date(deadline) : null,
    },
    include: { subtasks: { orderBy: { createdAt: "asc" } } },
  })

  return Response.json({
    ...task,
    deadline: task.deadline?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.task.delete({ where: { id } })
  return Response.json({ ok: true })
}
