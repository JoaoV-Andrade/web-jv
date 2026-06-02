const BASE = process.env.AMADEUS_BASE_URL ?? "https://api.amadeus.com"

let cached: { token: string; expiresAt: number } | null = null

async function getToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt - 30_000) return cached.token

  const res = await fetch(`${BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.AMADEUS_CLIENT_ID!,
      client_secret: process.env.AMADEUS_CLIENT_SECRET!,
    }),
  })

  if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status}`)
  const { access_token, expires_in } = await res.json()
  cached = { token: access_token, expiresAt: Date.now() + expires_in * 1000 }
  return access_token
}

export async function searchCheapestPrice(
  origin: string,
  destination: string,
  date: string,
  adults: number
): Promise<number | null> {
  try {
    const token = await getToken()
    const params = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults: String(adults),
      max: "5",
      currencyCode: "BRL",
    })

    const res = await fetch(`${BASE}/v2/shopping/flight-offers?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) return null
    const data = await res.json()
    const offers: Array<{ price: { grandTotal: string } }> = data.data ?? []
    if (!offers.length) return null

    return Math.min(...offers.map((o) => Number(o.price.grandTotal)))
  } catch {
    return null
  }
}

// Returns up to `max` evenly-spaced dates within the window, excluding past dates.
export function getDatesToCheck(from: Date, to: Date, max = 7): string[] {
  const today = new Date().toISOString().slice(0, 10)
  const start = new Date(from)
  const end = new Date(to)
  const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1)

  const dates: string[] = []
  if (diffDays <= max) {
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(start)
      d.setUTCDate(d.getUTCDate() + i)
      dates.push(d.toISOString().slice(0, 10))
    }
  } else {
    const step = (diffDays - 1) / (max - 1)
    for (let i = 0; i < max; i++) {
      const d = new Date(start)
      d.setUTCDate(d.getUTCDate() + Math.round(i * step))
      dates.push(d.toISOString().slice(0, 10))
    }
  }

  return [...new Set(dates)].filter((d) => d >= today)
}
