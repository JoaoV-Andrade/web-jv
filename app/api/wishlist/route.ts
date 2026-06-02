import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import type { WishlistItem } from "@/app/generated/prisma/client"

function serialize(item: WishlistItem) {
  return {
    ...item,
    price: item.price != null ? Number(item.price) : null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const category = searchParams.get("category")

  const where: Record<string, unknown> = {}
  if (status === "WANTED" || status === "BOUGHT") where.status = status
  if (category) where.category = category

  const items = await db.wishlistItem.findMany({
    where,
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  })

  return Response.json(items.map(serialize))
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { title, description, url, imageUrl, price, status, category, priority } = await req.json()
  if (!title) return Response.json({ error: "Título obrigatório" }, { status: 400 })

  const item = await db.wishlistItem.create({
    data: {
      title,
      description: description || null,
      url: url || null,
      imageUrl: imageUrl || null,
      price: price ? Number(price) : null,
      status: status || "WANTED",
      category: category || null,
      priority: priority || "MEDIUM",
    },
  })

  return Response.json(serialize(item), { status: 201 })
}
