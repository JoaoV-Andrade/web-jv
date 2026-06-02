import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { put } from "@vercel/blob"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "Armazenamento de imagens não configurado." }, { status: 503 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return Response.json({ error: "Arquivo não enviado" }, { status: 400 })

  const ext = file.name.split(".").pop() ?? "jpg"
  const filename = `wishlist/${Date.now()}.${ext}`

  const blob = await put(filename, file, { access: "public" })
  return Response.json({ url: blob.url })
}
