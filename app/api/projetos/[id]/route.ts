import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const project = await db.project.findUnique({
    where: { id },
    include: {
      tasks: {
        include: { subtasks: { orderBy: { createdAt: "asc" } } },
        orderBy: { position: "asc" },
      },
    },
  })

  if (!project) return Response.json({ error: "Not found" }, { status: 404 })

  return Response.json({
    ...project,
    deadline: project.deadline?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    tasks: project.tasks.map((t) => ({
      ...t,
      deadline: t.deadline?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { name, description, status, deadline } = await req.json()

  const project = await db.project.update({
    where: { id },
    data: {
      name,
      description: description || null,
      status,
      deadline: deadline ? new Date(deadline) : null,
    },
    include: { tasks: { select: { id: true, status: true } } },
  })

  return Response.json({
    ...project,
    deadline: project.deadline?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.project.delete({ where: { id } })
  return Response.json({ ok: true })
}
