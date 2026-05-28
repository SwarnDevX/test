"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Spring Boot OAuth2SuccessHandler redirects to this page with tokens as query params.
// We exchange them into a next-auth session via the jwt-tokens CredentialsProvider.
export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const username = searchParams.get("username");
    const roles = searchParams.get("roles") ?? "";

    if (!accessToken || !refreshToken) {
      router.replace("/auth/error?error=OAuthCallbackError");
      return;
    }

    signIn("jwt-tokens", {
      accessToken,
      refreshToken,
      userId: userId ?? "",
      email: email ?? "",
      username: username ?? "",
      roles,
      redirect: false,
    }).then((result) => {
      if (result?.error) {
        router.replace("/auth/error?error=" + encodeURIComponent(result.error));
      } else {
        router.replace("/problems");
      }
    });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <p>Completing sign-in…</p>
      </div>
    </div>
  );
}
