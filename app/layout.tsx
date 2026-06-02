import type { Metadata } from "next"
import { Fraunces, Hanken_Grotesk } from "next/font/google"
import "./globals.css"

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
})

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "web-jv",
  description: "App pessoal de organização",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Aplica o tema antes do paint para evitar flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t)})()`,
          }}
        />
      </head>
      <body className={`${fraunces.variable} ${hanken.variable}`}>
        {children}
      </body>
    </html>
  )
}
