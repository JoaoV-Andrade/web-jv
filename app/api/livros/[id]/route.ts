import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { title, author, description, status, rating, coverUrl, notes } = await req.json()

  const book = await db.book.update({
    where: { id },
    data: {
      title,
      author: author || null,
      description: description || null,
      status,
      rating: rating ?? null,
      coverUrl: coverUrl || null,
      notes: notes || null,
    },
  })

  return Response.json({
    ...book,
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.book.delete({ where: { id } })
  return Response.json({ ok: true })
}
