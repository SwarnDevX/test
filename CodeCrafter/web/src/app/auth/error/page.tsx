"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: "This email is already linked to a different sign-in method.",
  OAuthCallbackError: "OAuth sign-in was cancelled or failed. Please try again.",
  RefreshTokenExpired: "Your session expired. Please sign in again.",
  Default: "An authentication error occurred. Please try again.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "Default";
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-red-400">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <XCircle className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-zinc-300">{message}</p>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-500 w-full">
            <Link href="/auth/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
