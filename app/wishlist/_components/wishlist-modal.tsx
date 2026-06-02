"use client"

import { useState, useRef } from "react"
import { X, ImagePlus, Trash2 } from "lucide-react"

export type WishlistItem = {
  id: string
  title: string
  description: string | null
  url: string | null
  imageUrl: string | null
  price: number | null
  status: "WANTED" | "BOUGHT"
  category: string | null
  priority: "LOW" | "MEDIUM" | "HIGH"
}

type Props = {
  item?: WishlistItem
  onClose: () => void
  onSaved: (item: WishlistItem) => void
}

const PRIORITY_LABELS = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta" }

export function WishlistModal({ item, onClose, onSaved }: Props) {
  const isEditing = !!item
  const fileRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(item?.title ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [url, setUrl] = useState(item?.url ?? "")
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "")
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : "")
  const [status, setStatus] = useState<"WANTED" | "BOUGHT">(item?.status ?? "WANTED")
  const [category, setCategory] = useState(item?.category ?? "")
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">(item?.priority ?? "MEDIUM")

  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(item?.imageUrl ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setPendingFile(null)
    setPreview(null)
    setImageUrl("")
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError("Título obrigatório"); return }

    setSaving(true)
    setError("")

    try {
      let finalImageUrl = imageUrl

      // Upload new image if selected
      if (pendingFile) {
        const formData = new FormData()
        formData.append("file", pendingFile)
        const uploadRes = await fetch("/api/wishlist/upload", { method: "POST", body: formData })
        if (uploadRes.ok) {
          const { url: uploadedUrl } = await uploadRes.json()
          finalImageUrl = uploadedUrl
        } else if (uploadRes.status !== 503) {
          // 503 = blob not configured, skip silently
          const body = await uploadRes.json().catch(() => ({}))
          setError(body.error ?? "Erro ao enviar imagem")
          setSaving(false)
          return
        }
      }

      const endpoint = isEditing ? `/api/wishlist/${item.id}` : "/api/wishlist"
      const res = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description || null,
          url: url || null,
          imageUrl: finalImageUrl || null,
          price: price ? Number(price) : null,
          status,
          category: category || null,
          priority,
        }),
      })

      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao salvar")
      onSaved(await res.json())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-surface border border-border rounded-[var(--radius)] w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-medium text-text">{isEditing ? "Editar item" : "Novo item"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-[var(--radius-sm)] text-text-muted hover:bg-surface-2 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Image */}
          <div>
            {preview ? (
              <div className="relative rounded-[var(--radius-sm)] overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="preview" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-28 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-[var(--radius-sm)] text-text-muted hover:border-accent hover:text-accent transition-colors"
              >
                <ImagePlus size={22} />
                <span className="text-xs">Adicionar foto</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: AirPods Pro, Tênis Nike..."
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>

          {/* Price + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              >
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Categoria</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Tech, Moda..."
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "WANTED" | "BOUGHT")}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text focus:outline-none focus:border-accent"
              >
                <option value="WANTED">Quero</option>
                <option value="BOUGHT">Comprado</option>
              </select>
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Link do produto</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Anotações</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Cor preferida, tamanho, observações..."
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-[var(--radius-sm)] text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm text-text-muted border border-border rounded-[var(--radius-sm)] hover:bg-surface-2 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm bg-accent text-white font-medium rounded-[var(--radius-sm)] hover:bg-accent-hover disabled:opacity-50 transition-colors">
              {saving ? "Salvando..." : isEditing ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
