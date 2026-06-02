import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar"
import type { Trip } from "@/app/generated/prisma/client"

function serialize(t: Trip) {
  return {
    ...t,
    startDate: t.startDate?.toISOString() ?? null,
    endDate: t.endDate?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }
}

function validate(body: Record<string, unknown>) {
  const { destination, startDate, endDate, status, outboundFlight, returnFlight } = body
  if (!destination) return "Destino obrigatório"
  if (status !== "DREAMING") {
    if (!startDate || !endDate) return "Datas obrigatórias para este status"
    if ((endDate as string) < (startDate as string)) return "Data de volta não pode ser antes da ida"
  }
  if (status === "CONFIRMED") {
    if (!outboundFlight) return "Número do voo de ida obrigatório para viagem confirmada"
    if (!returnFlight) return "Número do voo de volta obrigatório para viagem confirmada"
  }
  return null
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const err = validate(body)
  if (err) return Response.json({ error: err }, { status: 400 })

  const { destination, startDate, endDate, status, notes, links, outboundFlight, returnFlight } = body

  const existing = await db.trip.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  const trip = await db.trip.update({
    where: { id },
    data: {
      destination,
      startDate: startDate ? new Date(startDate + "T12:00:00.000Z") : null,
      endDate: endDate ? new Date(endDate + "T12:00:00.000Z") : null,
      status,
      notes: notes || null,
      links: links ?? [],
      outboundFlight: outboundFlight || null,
      returnFlight: returnFlight || null,
    },
  })

  if (startDate && endDate) {
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
  } else if (existing.calendarEventId) {
    // Dates removed — delete calendar event
    await deleteCalendarEvent(existing.calendarEventId)
    await db.trip.update({ where: { id }, data: { calendarEventId: null } })
    trip.calendarEventId = null
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
