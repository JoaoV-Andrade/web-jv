import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const CALENDAR_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
const TOKEN_URL = "https://oauth2.googleapis.com/token"

async function fetchEvents(accessToken: string, timeMin: string, timeMax: string) {
  const url = new URL(CALENDAR_URL)
  url.searchParams.set("timeMin", timeMin)
  url.searchParams.set("timeMax", timeMax)
  url.searchParams.set("singleEvents", "true")
  url.searchParams.set("orderBy", "startTime")
  url.searchParams.set("maxResults", "250")
  return fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })
  if (!res.ok) return null
  const { access_token, expires_in } = await res.json()
  return { accessToken: access_token as string, expiresAt: new Date(Date.now() + (expires_in as number) * 1000) }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = Number(searchParams.get("month"))
  const year = Number(searchParams.get("year"))
  if (!month || !year) return Response.json({ error: "Parâmetros inválidos" }, { status: 400 })

  const pad = (n: number) => String(n).padStart(2, "0")
  const timeMin = `${year}-${pad(month)}-01T00:00:00.000Z`
  const timeMax =
    month === 12
      ? `${year + 1}-01-01T00:00:00.000Z`
      : `${year}-${pad(month + 1)}-01T00:00:00.000Z`

  // Load stored token (always up-to-date from last login / refresh)
  const stored = await db.oAuthToken.findUnique({ where: { provider: "google" } })
  if (!stored) {
    return Response.json(
      { error: "Calendário não autorizado. Faça logout e login novamente." },
      { status: 401 }
    )
  }

  let accessToken = stored.accessToken

  // Refresh proactively if within 5 min of expiry
  if (stored.expiresAt <= new Date(Date.now() + 5 * 60 * 1000)) {
    const refreshed = await refreshAccessToken(stored.refreshToken)
    if (!refreshed) {
      return Response.json(
        { error: "Sessão expirada. Faça logout e login novamente." },
        { status: 401 }
      )
    }
    await db.oAuthToken.update({
      where: { provider: "google" },
      data: { accessToken: refreshed.accessToken, expiresAt: refreshed.expiresAt },
    })
    accessToken = refreshed.accessToken
  }

  let res = await fetchEvents(accessToken, timeMin, timeMax)

  // One retry after unexpected 401 (race condition with token)
  if (res.status === 401) {
    const refreshed = await refreshAccessToken(stored.refreshToken)
    if (!refreshed) {
      return Response.json(
        { error: "Sessão expirada. Faça logout e login novamente." },
        { status: 401 }
      )
    }
    await db.oAuthToken.update({
      where: { provider: "google" },
      data: { accessToken: refreshed.accessToken, expiresAt: refreshed.expiresAt },
    })
    res = await fetchEvents(refreshed.accessToken, timeMin, timeMax)
  }

  if (!res.ok) {
    return Response.json({ error: "Erro ao buscar eventos do Google Calendar." }, { status: 502 })
  }

  const data = await res.json()
  return Response.json(data.items ?? [])
}
