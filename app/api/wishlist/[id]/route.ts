import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { del } from "@vercel/blob"
import type { WishlistItem } from "@/app/generated/prisma/client"

function serialize(item: WishlistItem) {
  return {
    ...item,
    price: item.price != null ? Number(item.price) : null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { title, description, url, imageUrl, price, status, category, priority } = await req.json()

  const existing = await db.wishlistItem.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  // Delete old blob image if replaced
  if (existing.imageUrl && imageUrl !== existing.imageUrl && process.env.BLOB_READ_WRITE_TOKEN) {
    await del(existing.imageUrl).catch(() => null)
  }

  const item = await db.wishlistItem.update({
    where: { id },
    data: {
      title,
      description: description || null,
      url: url || null,
      imageUrl: imageUrl ?? existing.imageUrl,
      price: price != null ? Number(price) : null,
      status,
      category: category || null,
      priority,
    },
  })

  return Response.json(serialize(item))
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const item = await db.wishlistItem.findUnique({ where: { id } })
  if (!item) return Response.json({ error: "Not found" }, { status: 404 })

  if (item.imageUrl && process.env.BLOB_READ_WRITE_TOKEN) {
    await del(item.imageUrl).catch(() => null)
  }

  await db.wishlistItem.delete({ where: { id } })
  return Response.json({ ok: true })
}
