import { db } from "@/lib/db"
import { searchCheapestPrice } from "@/lib/travelpayouts"
import { sendTelegramMessage } from "@/lib/telegram"

export const dynamic = "force-dynamic"

function fmtPrice(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10).split("-").reverse().join("/")
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const routes = await db.watchedRoute.findMany({
    include: { priceHistory: { orderBy: { checkedAt: "desc" }, take: 30 } },
  })

  const results: { id: string; route: string; price: number | null; notified: boolean }[] = []
  const today = new Date()

  for (const route of routes) {
    const routeLabel = `${route.origin}→${route.destination}`

    // Skip routes whose entire date window is in the past
    if (route.departureDateTo < today) {
      results.push({ id: route.id, route: routeLabel, price: null, notified: false })
      continue
    }

    const minPrice = await searchCheapestPrice(
      route.origin,
      route.destination,
      route.departureDateFrom,
      route.departureDateTo,
      route.passengers,
    )

    if (minPrice === null) {
      // No data from Travelpayouts cache for this route — skip silently (already logged inside lib)
      results.push({ id: route.id, route: routeLabel, price: null, notified: false })
      continue
    }

    await db.priceHistory.create({
      data: { routeId: route.id, price: minPrice, currency: "BRL" },
    })

    // Determine if notification should fire
    let shouldNotify = false
    let reason = ""

    if (route.targetPrice && minPrice <= Number(route.targetPrice)) {
      shouldNotify = true
      reason = `abaixo do seu alvo de R$ ${fmtPrice(Number(route.targetPrice))}`
    }

    if (!shouldNotify && route.movingAvgDays && route.priceHistory.length >= 3) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - route.movingAvgDays)
      const recentPrices = route.priceHistory
        .filter((p) => p.checkedAt >= cutoff)
        .map((p) => Number(p.price))

      if (recentPrices.length > 0) {
        const avg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length
        if (minPrice < avg * 0.9) {
          shouldNotify = true
          reason = `10% abaixo da média (R$ ${fmtPrice(avg)})`
        }
      }
    }

    // Throttle: skip if already notified in the last 23h
    if (shouldNotify && route.lastNotifiedAt) {
      const hoursSince = (Date.now() - route.lastNotifiedAt.getTime()) / 3_600_000
      if (hoursSince < 23) shouldNotify = false
    }

    let notified = false
    if (shouldNotify) {
      const msg = [
        "✈️ <b>Alerta de Passagem</b>",
        "",
        `<b>${route.origin} → ${route.destination}</b>`,
        `📅 ${fmtDate(route.departureDateFrom)} – ${fmtDate(route.departureDateTo)}`,
        `💰 R$ ${fmtPrice(minPrice)}`,
        `📊 ${reason}`,
      ].join("\n")

      notified = await sendTelegramMessage(msg)

      if (notified) {
        await db.watchedRoute.update({
          where: { id: route.id },
          data: { lastNotifiedAt: new Date(), lastNotifiedPrice: minPrice },
        })
      }
    }

    results.push({ id: route.id, route: routeLabel, price: minPrice, notified })
  }

  return Response.json({ ok: true, checked: results.length, results })
}
