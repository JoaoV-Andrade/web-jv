"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"

type CalendarEvent = {
  id: string
  summary?: string
  description?: string
  location?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
}

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function eventDateStr(e: CalendarEvent) {
  return e.start.date ?? e.start.dateTime?.slice(0, 10)
}

function eventTime(e: CalendarEvent) {
  if (!e.start.dateTime) return null
  return new Date(e.start.dateTime).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function eventEndTime(e: CalendarEvent) {
  if (!e.end?.dateTime) return null
  return new Date(e.end.dateTime).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AgendaPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate())

  useEffect(() => {
    setLoading(true)
    setError("")
    fetch(`/api/agenda/events?month=${month}&year=${year}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Erro")
        return r.json()
      })
      .then((data: CalendarEvent[]) => setEvents(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [month, year])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  // Build calendar grid cells
  const firstWeekDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const pad = (n: number) => String(n).padStart(2, "0")
  function dayEvents(day: number) {
    const dateStr = `${year}-${pad(month)}-${pad(day)}`
    return events.filter((e) => eventDateStr(e) === dateStr)
  }

  const todayY = now.getFullYear()
  const todayM = now.getMonth() + 1
  const todayD = now.getDate()
  const isCurrentMonth = year === todayY && month === todayM

  const selectedEvents = selectedDay ? dayEvents(selectedDay) : []

  return (
    <AppShell>
      <div className="max-w-3xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl text-text">Agenda</h1>
          <div className="flex items-center gap-1 bg-surface border border-border rounded-[var(--radius-sm)] px-1">
            <button
              onClick={prevMonth}
              className="p-2 text-text-muted hover:text-text transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-text min-w-40 text-center">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 text-text-muted hover:text-text transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div
          className="bg-surface border border-border rounded-[var(--radius)] overflow-hidden"
          style={{ boxShadow: "var(--shadow)" }}
        >
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-border bg-surface-2">
            {WEEK_DAYS.map((d, i) => (
              <div
                key={d}
                className={`py-2.5 text-center text-xs font-medium ${
                  i === 0 || i === 6 ? "text-danger/70" : "text-text-muted"
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="py-20 text-center text-text-muted text-sm">Carregando...</div>
          ) : error ? (
            <div className="py-20 text-center px-6">
              <CalendarDays size={36} className="text-border mx-auto mb-3" />
              <p className="text-text-muted text-sm">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 divide-x divide-y divide-border">
              {cells.map((day, idx) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-24 bg-surface-2/40 p-1"
                    />
                  )
                }

                const evs = dayEvents(day)
                const isToday = isCurrentMonth && day === todayD
                const isSelected = day === selectedDay

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`min-h-24 p-1.5 text-left align-top transition-colors hover:bg-surface-2 ${
                      isSelected ? "bg-accent-soft" : ""
                    }`}
                  >
                    {/* Day number */}
                    <div
                      className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full mb-1 ${
                        isToday
                          ? "bg-accent text-white"
                          : "text-text"
                      }`}
                    >
                      {day}
                    </div>

                    {/* Event chips */}
                    <div className="space-y-0.5">
                      {evs.slice(0, 3).map((e) => {
                        const t = eventTime(e)
                        return (
                          <div
                            key={e.id}
                            className="text-[10px] bg-accent/10 text-accent px-1 py-0.5 rounded truncate leading-tight"
                          >
                            {t && <span className="font-semibold mr-0.5">{t}</span>}
                            {e.summary ?? "(sem título)"}
                          </div>
                        )
                      })}
                      {evs.length > 3 && (
                        <p className="text-[10px] text-text-muted px-1">
                          +{evs.length - 3} mais
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected day detail */}
        {selectedDay && !loading && !error && (
          <div
            className="bg-surface border border-border rounded-[var(--radius)] p-5"
            style={{ boxShadow: "var(--shadow)" }}
          >
            <h2 className="text-sm font-medium text-text mb-3">
              {selectedDay} de {MONTH_NAMES[month - 1].toLowerCase()}
              {isCurrentMonth && selectedDay === todayD && (
                <span className="ml-2 text-xs text-accent font-normal">hoje</span>
              )}
            </h2>

            {selectedEvents.length === 0 ? (
              <p className="text-xs text-text-muted">Sem eventos neste dia.</p>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((e) => {
                  const start = eventTime(e)
                  const end = eventEndTime(e)
                  return (
                    <div
                      key={e.id}
                      className="flex gap-3 items-start py-2 border-b border-border last:border-0"
                    >
                      <div className="w-0.5 self-stretch rounded-full bg-accent shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text leading-snug">
                          {e.summary ?? "(sem título)"}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {e.start.date
                            ? "Dia todo"
                            : start
                              ? end ? `${start} – ${end}` : start
                              : null}
                        </p>
                        {e.location && (
                          <p className="text-xs text-text-muted mt-0.5 truncate">
                            📍 {e.location}
                          </p>
                        )}
                        {e.description && (
                          <p className="text-xs text-text-muted mt-1 line-clamp-2 whitespace-pre-line">
                            {e.description.replace(/<[^>]+>/g, "")}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
