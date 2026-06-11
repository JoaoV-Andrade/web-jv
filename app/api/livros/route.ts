import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const books = await db.book.findMany({ orderBy: { createdAt: "desc" } })

  return Response.json(
    books.map((b) => ({
      ...b,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }))
  )
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { title, author, description, status, rating, coverUrl, notes } = await req.json()
  if (!title) return Response.json({ error: "Título obrigatório" }, { status: 400 })

  const book = await db.book.create({
    data: {
      title,
      author: author || null,
      description: description || null,
      status: status || "WANT_TO_READ",
      rating: rating ?? null,
      coverUrl: coverUrl || null,
      notes: notes || null,
    },
  })

  return Response.json(
    {
      ...book,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
    },
    { status: 201 }
  )
}
