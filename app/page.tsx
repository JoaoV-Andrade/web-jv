import { AppShell } from "@/components/app-shell"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="font-serif text-3xl text-text mb-1">
          Olá{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-text-muted text-sm mb-8">
          Bem-vindo ao seu app de organização.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Finanças", href: "/financas", emoji: "💰" },
            { label: "Projetos", href: "/projetos", emoji: "📂" },
            { label: "Agenda",   href: "/agenda",   emoji: "📅" },
            { label: "Viagens",  href: "/viagens",  emoji: "✈️" },
            { label: "Wishlist", href: "/wishlist",  emoji: "❤️" },
          ].map(({ label, href, emoji }) => (
            <a
              key={href}
              href={href}
              className="bg-surface border border-border rounded-[var(--radius)] p-5 flex flex-col gap-2 hover:bg-surface-2 transition-colors"
              style={{ boxShadow: "var(--shadow)" }}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-medium text-text">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
