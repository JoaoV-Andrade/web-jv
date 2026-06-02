import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar",
        },
      },
    }),
  ],
  callbacks: {
    signIn({ user }) {
      return user.email === process.env.OWNER_EMAIL
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        // Persiste o refresh token no banco para uso nos cron jobs
        if (account.refresh_token) {
          const { db } = await import("@/lib/db")
          await db.oAuthToken.upsert({
            where: { provider: "google" },
            create: {
              provider: "google",
              accessToken: account.access_token!,
              refreshToken: account.refresh_token,
              expiresAt: new Date((account.expires_at ?? 0) * 1000),
            },
            update: {
              accessToken: account.access_token!,
              refreshToken: account.refresh_token,
              expiresAt: new Date((account.expires_at ?? 0) * 1000),
            },
          })
        }
      }
      return token
    },
    session({ session, token }) {
      return { ...session, accessToken: token.accessToken as string | undefined }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
}
