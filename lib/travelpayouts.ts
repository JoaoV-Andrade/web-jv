const BASE = "https://api.travelpayouts.com"

interface TpPriceEntry {
  price: number
  airline: string
  flight_number: number
  departure_at: string
  return_at: string | null
  expires_at: string
  transfers: number
  origin: string
  destination: string
}

/**
 * Searches for the cheapest one-way price within a date window.
 * Makes one API call per calendar month in the window, then picks the minimum
 * across all dates that fall inside [dateFrom, dateTo].
 * Returns null if no prices are found or the API is not configured.
 */
export async function searchCheapestPrice(
  origin: string,
  destination: string,
  dateFrom: Date,
  dateTo: Date,
  passengers = 1,
): Promise<number | null> {
  const token = process.env.TRAVELPAYOUTS_TOKEN
  if (!token) return null

  const fromStr = dateFrom.toISOString().slice(0, 10)
  const toStr = dateTo.toISOString().slice(0, 10)
  const now = new Date().toISOString()

  // Build the set of unique YYYY-MM months that overlap the window
  const months = new Set<string>()
  const cursor = new Date(Date.UTC(dateFrom.getUTCFullYear(), dateFrom.getUTCMonth(), 1))
  const endMonth = new Date(Date.UTC(dateTo.getUTCFullYear(), dateTo.getUTCMonth(), 1))
  while (cursor <= endMonth) {
    months.add(cursor.toISOString().slice(0, 7))
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  let minPrice: number | null = null

  for (const month of months) {
    try {
      const params = new URLSearchParams({
        origin,
        destination,
        departure_at: month,
        one_way: "true",
        cy: "brl",
        limit: "30",
        sorting: "price",
        token,
      })

      const res = await fetch(`${BASE}/aviasales/v3/prices_for_dates?${params}`, {
        headers: { "X-Access-Token": token },
      })

      if (!res.ok) {
        console.warn(`[travelpayouts] HTTP ${res.status} — ${origin}→${destination} ${month}`)
        continue
      }

      const json: { success: boolean; data?: Record<string, TpPriceEntry>; error?: string } =
        await res.json()

      if (!json.success || !json.data) {
        if (json.error) console.warn(`[travelpayouts] API error: ${json.error}`)
        continue
      }

      for (const [date, entry] of Object.entries(json.data)) {
        if (date < fromStr || date > toStr) continue       // outside requested window
        if (entry.expires_at && entry.expires_at < now) continue  // stale cache entry
        if (typeof entry.price === "number") {
          const total = entry.price * passengers
          if (minPrice === null || total < minPrice) minPrice = total
        }
      }
    } catch (err) {
      console.error(`[travelpayouts] fetch error — ${origin}→${destination} ${month}:`, err)
    }
  }

  if (minPrice === null) {
    console.info(
      `[travelpayouts] no prices available for ${origin}→${destination} (${fromStr}–${toStr})`,
    )
  }

  return minPrice
}
