import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar"
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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { destination, startDate, endDate, status, notes, links } = await req.json()

  const existing = await db.trip.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  const trip = await db.trip.update({
    where: { id },
    data: {
      destination,
      startDate: new Date(startDate + "T12:00:00.000Z"),
      endDate: new Date(endDate + "T12:00:00.000Z"),
      status,
      notes: notes || null,
      links: links ?? [],
    },
  })

  const eventInput = { summary: `✈ ${destination}`, description: notes, startDate, endDate }

  if (existing.calendarEventId) {
    await updateCalendarEvent(existing.calendarEventId, eventInput)
  } else {
    const calendarEventId = await createCalendarEvent(eventInput)
    if (calendarEventId) {
      await db.trip.update({ where: { id }, data: { calendarEventId } })
      trip.calendarEventId = calendarEventId
    }
  }

  return Response.json(serialize(trip))
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const trip = await db.trip.findUnique({ where: { id } })
  if (!trip) return Response.json({ error: "Not found" }, { status: 404 })

  if (trip.calendarEventId) await deleteCalendarEvent(trip.calendarEventId)
  await db.trip.delete({ where: { id } })
  return Response.json({ ok: true })
}
