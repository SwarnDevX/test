import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${BACKEND}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  return res.json() as Promise<{
    accessToken: string;
    refreshToken: string;
    userId: number;
    email: string;
    username: string;
    roles: string[];
  }>;
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Used by the /auth/callback page to exchange tokens handed back by Spring OAuth2
    CredentialsProvider({
      id: "jwt-tokens",
      name: "JWT Tokens",
      credentials: {
        accessToken: {},
        refreshToken: {},
        userId: {},
        email: {},
        username: {},
      },
      async authorize(credentials) {
        if (!credentials?.accessToken) return null;
        return {
          id: credentials.userId,
          email: credentials.email,
          username: credentials.username,
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          roles: [],
        };
      },
    }),

    // Standard email/password — calls Spring Boot directly
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const res = await fetch(`${BACKEND}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail ?? "Invalid credentials");
        }
        const data = await res.json();
        return {
          id: String(data.userId),
          email: data.email,
          username: data.username,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          roles: data.roles ?? [],
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign-in with credentials provider
      if (user && (account?.provider === "credentials" || account?.provider === "jwt-tokens")) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.userId = Number((user as any).id);
        token.username = (user as any).username;
        token.roles = (user as any).roles ?? [];
        // Store expiry as epoch ms (access token = 15 min)
        token.accessTokenExpires = Date.now() + 14 * 60 * 1000;
        return token;
      }

      // Token still valid
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token expired — try to refresh
      const refreshed = await refreshAccessToken(token.refreshToken);
      if (!refreshed) {
        return { ...token, error: "RefreshTokenExpired" as const };
      }
      return {
        ...token,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        accessTokenExpires: Date.now() + 14 * 60 * 1000,
        error: undefined,
      };
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.userId = token.userId;
      session.username = token.username;
      session.roles = token.roles;
      if (token.error) session.error = token.error;
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
};
