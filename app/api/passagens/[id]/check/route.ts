import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { searchCheapestPrice } from "@/lib/travelpayouts"
import { serialize } from "../../route"

const INCLUDE = {
  priceHistory: { orderBy: { checkedAt: "desc" as const }, take: 5 },
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  if (!process.env.TRAVELPAYOUTS_TOKEN) {
    return Response.json({ error: "Integração Travelpayouts não configurada." }, { status: 503 })
  }

  const { id } = await params
  const route = await db.watchedRoute.findUnique({ where: { id } })
  if (!route) return Response.json({ error: "Not found" }, { status: 404 })

  if (route.departureDateTo < new Date()) {
    return Response.json({ error: "Todas as datas desta rota já passaram." }, { status: 400 })
  }

  const minPrice = await searchCheapestPrice(
    route.origin,
    route.destination,
    route.departureDateFrom,
    route.departureDateTo,
    route.passengers,
  )

  if (minPrice !== null) {
    await db.priceHistory.create({
      data: { routeId: id, price: minPrice, currency: "BRL" },
    })
  }

  const updated = await db.watchedRoute.findUnique({ where: { id }, include: INCLUDE })
  return Response.json({ price: minPrice, route: serialize(updated!) })
}
