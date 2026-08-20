"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";

type Props = {
  isPending: boolean;
  error: Error | null;
  skeletonClassName?: string;
  children: React.ReactNode;
};

export function QuerySection({
  isPending,
  error,
  skeletonClassName,
  children,
}: Props) {
  if (isPending)
    return <Skeleton className={skeletonClassName ?? "h-32 w-full"} />;

  if (error) {
    const message =
      error instanceof ApiError && error.status === 401
        ? "인증이 필요합니다. 로그인 토큰을 확인해 주세요."
        : "불러오지 못했습니다.";

    return (
      <div className="flex h-32 items-center justify-center border border-dashed text-sm text-muted-foreground">
        {message}
      </div>
    );
  }

  return children;
}
