import { apiFetch } from "@/lib/api"
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // First time login → sync with Express backend
      if (account && profile) {
        const res = await apiFetch("/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: profile.email,
            name: profile.name,
          }),
        })

        const user = await res.json()

        // Store user.id in the JWT
        token.id = user.id
      }

      return token
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        // Attach id to session.user
        session.user.id = token.id as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
})

export { handler as GET, handler as POST }
