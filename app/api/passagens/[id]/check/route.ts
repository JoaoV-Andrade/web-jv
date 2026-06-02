import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { searchCheapestPrice, getDatesToCheck } from "@/lib/amadeus"
import { serialize } from "../../route"

const INCLUDE = {
  priceHistory: { orderBy: { checkedAt: "desc" as const }, take: 5 },
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  if (!process.env.AMADEUS_CLIENT_ID) {
    return Response.json({ error: "Integração Amadeus não configurada." }, { status: 503 })
  }

  const { id } = await params
  const route = await db.watchedRoute.findUnique({ where: { id } })
  if (!route) return Response.json({ error: "Not found" }, { status: 404 })

  const dates = getDatesToCheck(route.departureDateFrom, route.departureDateTo)
  if (!dates.length) {
    return Response.json({ error: "Todas as datas desta rota já passaram." }, { status: 400 })
  }

  let minPrice: number | null = null
  for (const date of dates) {
    const price = await searchCheapestPrice(route.origin, route.destination, date, route.passengers)
    if (price !== null && (minPrice === null || price < minPrice)) minPrice = price
  }

  if (minPrice !== null) {
    await db.priceHistory.create({
      data: { routeId: id, price: minPrice, currency: "BRL" },
    })
  }

  const updated = await db.watchedRoute.findUnique({ where: { id }, include: INCLUDE })
  return Response.json({ price: minPrice, route: serialize(updated!) })
}
