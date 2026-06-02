import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createCalendarEvent } from "@/lib/google-calendar"
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

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const trips = await db.trip.findMany({ orderBy: { createdAt: "desc" } })
  return Response.json(trips.map(serialize))
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const err = validate(body)
  if (err) return Response.json({ error: err }, { status: 400 })

  const { destination, startDate, endDate, status, notes, links, outboundFlight, returnFlight } = body

  const trip = await db.trip.create({
    data: {
      destination,
      startDate: startDate ? new Date(startDate + "T12:00:00.000Z") : null,
      endDate: endDate ? new Date(endDate + "T12:00:00.000Z") : null,
      status: status || "PLANNED",
      notes: notes || null,
      links: links ?? [],
      outboundFlight: outboundFlight || null,
      returnFlight: returnFlight || null,
    },
  })

  if (startDate && endDate) {
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
  }

  return Response.json(serialize(trip), { status: 201 })
}
