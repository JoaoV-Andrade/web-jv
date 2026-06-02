import { Providers } from "./providers"
import { Sidebar } from "./sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex h-screen overflow-hidden bg-bg">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </Providers>
  )
}
