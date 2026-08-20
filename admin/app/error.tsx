"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <p className="text-sm text-muted-foreground">
        화면을 그리다 문제가 생겼습니다.
      </p>
      <Button variant="outline" onClick={reset}>
        다시 시도
      </Button>
    </div>
  );
}
