"use client"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null
    setTheme(saved ?? "light")
  }, [])

  function toggle() {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    localStorage.setItem("theme", next)
    document.documentElement.setAttribute("data-theme", next)
  }

  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      className="p-2 rounded-[var(--radius-sm)] text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}
