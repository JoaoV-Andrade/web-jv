import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import type { WatchedRoute, PriceHistory } from "@/app/generated/prisma/client"

type RouteWithHistory = WatchedRoute & { priceHistory: PriceHistory[] }

export function serialize(r: RouteWithHistory) {
  return {
    ...r,
    targetPrice: r.targetPrice != null ? Number(r.targetPrice) : null,
    lastNotifiedPrice: r.lastNotifiedPrice != null ? Number(r.lastNotifiedPrice) : null,
    departureDateFrom: r.departureDateFrom.toISOString(),
    departureDateTo: r.departureDateTo.toISOString(),
    lastNotifiedAt: r.lastNotifiedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    priceHistory: r.priceHistory.map((p) => ({
      ...p,
      price: Number(p.price),
      checkedAt: p.checkedAt.toISOString(),
    })),
  }
}

const INCLUDE = {
  priceHistory: { orderBy: { checkedAt: "desc" as const }, take: 5 },
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const routes = await db.watchedRoute.findMany({
    include: INCLUDE,
    orderBy: { createdAt: "desc" },
  })

  return Response.json(routes.map(serialize))
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { origin, destination, departureDateFrom, departureDateTo, passengers, targetPrice } =
    await req.json()

  if (!origin || !destination || !departureDateFrom || !departureDateTo) {
    return Response.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }
  if (departureDateTo < departureDateFrom) {
    return Response.json({ error: "Data final deve ser após a data inicial" }, { status: 400 })
  }

  const route = await db.watchedRoute.create({
    data: {
      origin: String(origin).toUpperCase().trim(),
      destination: String(destination).toUpperCase().trim(),
      departureDateFrom: new Date(departureDateFrom + "T12:00:00.000Z"),
      departureDateTo: new Date(departureDateTo + "T12:00:00.000Z"),
      passengers: Number(passengers) || 1,
      targetPrice: targetPrice ? Number(targetPrice) : null,
      movingAvgDays: 30,
    },
    include: INCLUDE,
  })

  return Response.json(serialize(route), { status: 201 })
}
