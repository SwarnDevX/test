import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    refreshToken: string;
    userId: number;
    username: string;
    roles: string[];
    error?: "RefreshTokenExpired";
  }

  interface User {
    id: string;
    email: string;
    username: string;
    accessToken: string;
    refreshToken: string;
    roles: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    userId: number;
    username: string;
    roles: string[];
    accessTokenExpires: number;
    error?: "RefreshTokenExpired";
  }
}
