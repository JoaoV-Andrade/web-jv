import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const projects = await db.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tasks: { select: { id: true, status: true } },
    },
  })

  return Response.json(
    projects.map((p) => ({
      ...p,
      deadline: p.deadline?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))
  )
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { name, description, status, deadline } = await req.json()
  if (!name) return Response.json({ error: "Nome obrigatório" }, { status: 400 })

  const project = await db.project.create({
    data: {
      name,
      description: description || null,
      status: status || "ACTIVE",
      deadline: deadline ? new Date(deadline) : null,
    },
    include: { tasks: { select: { id: true, status: true } } },
  })

  return Response.json(
    {
      ...project,
      deadline: project.deadline?.toISOString() ?? null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    },
    { status: 201 }
  )
}
