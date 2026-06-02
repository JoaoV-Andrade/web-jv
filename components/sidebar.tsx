"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Wallet,
  FolderKanban,
  Calendar,
  Plane,
  Heart,
  LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { ThemeToggle } from "./theme-toggle"

const NAV = [
  { href: "/",          label: "Início",    icon: LayoutDashboard },
  { href: "/financas",  label: "Finanças",  icon: Wallet          },
  { href: "/projetos",  label: "Projetos",  icon: FolderKanban    },
  { href: "/agenda",    label: "Agenda",    icon: Calendar        },
  { href: "/viagens",   label: "Viagens",   icon: Plane           },
  { href: "/wishlist",  label: "Wishlist",  icon: Heart           },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full w-56 bg-surface border-r border-border px-3 py-5 shrink-0">
      {/* Logo */}
      <div className="px-3 mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/funky-sorraz.svg" alt="web-jv" className="w-full h-auto" />
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-soft text-accent"
                  : "text-text-muted hover:text-text hover:bg-surface-2"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="flex items-center justify-between px-3 pt-4 border-t border-border mt-4">
        <ThemeToggle />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 rounded-[var(--radius-sm)] text-text-muted hover:text-danger hover:bg-surface-2 transition-colors"
          aria-label="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  )
}
