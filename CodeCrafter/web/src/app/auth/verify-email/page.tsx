"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token provided.");
      return;
    }

    fetch("/api/v1/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
        } else {
          const data = await res.json().catch(() => ({}));
          setErrorMsg(data.detail ?? "Verification failed.");
          setStatus("error");
        }
      })
      .catch(() => {
        setErrorMsg("Network error. Please try again.");
        setStatus("error");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 text-zinc-400">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
              <p>Verifying your email…</p>
            </div>
          )}
          {status === "success" && (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <p className="text-zinc-200 font-medium">Email verified successfully!</p>
              <p className="text-zinc-400 text-sm">You can now sign in to your account.</p>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-500 mt-2">
                <Link href="/auth/login">Go to Login</Link>
              </Button>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center gap-3">
              <XCircle className="h-12 w-12 text-red-400" />
              <p className="text-zinc-200 font-medium">Verification failed</p>
              <p className="text-zinc-400 text-sm">{errorMsg}</p>
              <Button asChild variant="outline" className="border-zinc-700 mt-2">
                <Link href="/auth/login">Back to Login</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
