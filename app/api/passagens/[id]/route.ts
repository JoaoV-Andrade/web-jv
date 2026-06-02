import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { serialize } from "../route"

const INCLUDE = {
  priceHistory: { orderBy: { checkedAt: "desc" as const }, take: 5 },
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { origin, destination, departureDateFrom, departureDateTo, passengers, targetPrice } =
    await req.json()

  if (!origin || !destination || !departureDateFrom || !departureDateTo) {
    return Response.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }

  const existing = await db.watchedRoute.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  const route = await db.watchedRoute.update({
    where: { id },
    data: {
      origin: String(origin).toUpperCase().trim(),
      destination: String(destination).toUpperCase().trim(),
      departureDateFrom: new Date(departureDateFrom + "T12:00:00.000Z"),
      departureDateTo: new Date(departureDateTo + "T12:00:00.000Z"),
      passengers: Number(passengers) || 1,
      targetPrice: targetPrice ? Number(targetPrice) : null,
    },
    include: INCLUDE,
  })

  return Response.json(serialize(route))
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const existing = await db.watchedRoute.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  await db.watchedRoute.delete({ where: { id } })
  return Response.json({ ok: true })
}
