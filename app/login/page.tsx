import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { LoginButton } from "@/components/login-button"
import { Providers } from "@/components/providers"

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/")

  return (
    <Providers>
      <main className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div
          className="bg-surface border border-border rounded-[var(--radius)] p-10 flex flex-col items-center gap-6 w-full max-w-sm"
          style={{ boxShadow: "var(--shadow)" }}
        >
          <div className="text-center">
            <h1 className="font-serif text-3xl text-text mb-1">web-jv</h1>
            <p className="text-text-muted text-sm">
              Seu app pessoal de organização
            </p>
          </div>
          <LoginButton />
        </div>
      </main>
    </Providers>
  )
}
