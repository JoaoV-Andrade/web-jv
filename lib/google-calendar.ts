import { db } from "@/lib/db"

const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
const TOKEN_URL = "https://oauth2.googleapis.com/token"

export async function getValidGoogleToken(): Promise<string | null> {
  const stored = await db.oAuthToken.findUnique({ where: { provider: "google" } })
  if (!stored) return null

  if (stored.expiresAt <= new Date(Date.now() + 5 * 60 * 1000)) {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: stored.refreshToken,
        grant_type: "refresh_token",
      }),
    })
    if (!res.ok) return null
    const { access_token, expires_in } = await res.json()
    await db.oAuthToken.update({
      where: { provider: "google" },
      data: {
        accessToken: access_token as string,
        expiresAt: new Date(Date.now() + (expires_in as number) * 1000),
      },
    })
    return access_token as string
  }

  return stored.accessToken
}

type EventInput = {
  summary: string
  description?: string | null
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD (inclusive; +1 day sent to Google)
}

function buildBody(input: EventInput) {
  const exclusiveEnd = new Date(input.endDate + "T00:00:00.000Z")
  exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1)
  return {
    summary: input.summary,
    ...(input.description ? { description: input.description } : {}),
    start: { date: input.startDate },
    end: { date: exclusiveEnd.toISOString().slice(0, 10) },
    colorId: "6", // turquoise
  }
}

export async function createCalendarEvent(input: EventInput): Promise<string | null> {
  const token = await getValidGoogleToken()
  if (!token) return null
  const res = await fetch(CALENDAR_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(buildBody(input)),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.id as string
}

export async function updateCalendarEvent(eventId: string, input: EventInput): Promise<void> {
  const token = await getValidGoogleToken()
  if (!token) return
  await fetch(`${CALENDAR_API}/${eventId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(buildBody(input)),
  })
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const token = await getValidGoogleToken()
  if (!token) return
  await fetch(`${CALENDAR_API}/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
}
