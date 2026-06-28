import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { MEI_DEFAULT_ANNUAL, MEI_DEFAULT_MONTHLY } from "@/lib/mei"

function serialize(s: {
  id: string
  openingMonth: number
  openingYear: number
  annualLimit: unknown
  monthlyLimit: unknown
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...s,
    annualLimit: Number(s.annualLimit),
    monthlyLimit: Number(s.monthlyLimit),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const settings = await db.meiSettings.findFirst()
  return Response.json(settings ? serialize(settings) : null)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { openingMonth, openingYear, annualLimit, monthlyLimit } = await req.json()

  const month = Number(openingMonth)
  const year = Number(openingYear)
  if (!month || month < 1 || month > 12 || !year) {
    return Response.json({ error: "Mês/ano de abertura inválido" }, { status: 400 })
  }

  const data = {
    openingMonth: month,
    openingYear: year,
    annualLimit: annualLimit != null ? Number(annualLimit) : MEI_DEFAULT_ANNUAL,
    monthlyLimit: monthlyLimit != null ? Number(monthlyLimit) : MEI_DEFAULT_MONTHLY,
  }

  const existing = await db.meiSettings.findFirst()
  const settings = existing
    ? await db.meiSettings.update({ where: { id: existing.id }, data })
    : await db.meiSettings.create({ data })

  return Response.json(serialize(settings))
}
