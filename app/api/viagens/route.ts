import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createCalendarEvent } from "@/lib/google-calendar"
import type { Trip } from "@/app/generated/prisma/client"

function serialize(t: Trip) {
  return {
    ...t,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const trips = await db.trip.findMany({ orderBy: { startDate: "desc" } })
  return Response.json(trips.map(serialize))
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { destination, startDate, endDate, status, notes, links } = await req.json()
  if (!destination || !startDate || !endDate) {
    return Response.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }

  const trip = await db.trip.create({
    data: {
      destination,
      startDate: new Date(startDate + "T12:00:00.000Z"),
      endDate: new Date(endDate + "T12:00:00.000Z"),
      status: status || "PLANNED",
      notes: notes || null,
      links: links ?? [],
    },
  })

  // Create Calendar event (non-critical)
  const calendarEventId = await createCalendarEvent({
    summary: `✈ ${destination}`,
    description: notes,
    startDate,
    endDate,
  })

  if (calendarEventId) {
    await db.trip.update({ where: { id: trip.id }, data: { calendarEventId } })
    trip.calendarEventId = calendarEventId
  }

  return Response.json(serialize(trip), { status: 201 })
}
