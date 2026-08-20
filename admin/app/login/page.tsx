"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PendingButton } from "@/components/pending-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { roleOf, saveTokens } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const tokens = await login(phoneNumber, password);

      if (roleOf(tokens.accessToken) !== "ADMIN") {
        setError("관리자 계정이 아닙니다.");
        return;
      }

      saveTokens(tokens);
      router.replace("/");
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "로그인하지 못했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>집콕 어드민</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input
              inputMode="numeric"
              autoComplete="username"
              placeholder="전화번호"
              value={phoneNumber}
              onChange={(event) =>
                setPhoneNumber(event.target.value.replace(/\D/g, ""))
              }
            />
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <PendingButton
              type="submit"
              pending={submitting}
              disabled={!phoneNumber || !password}
            >
              로그인
            </PendingButton>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
