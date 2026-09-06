"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PendingButton } from "@/components/pending-button";
import { ApiError } from "@/lib/api/client";
import { syncAppleAdsReports } from "@/lib/api/apple-ads";
import { formatCount } from "@/lib/format";

type Props = {
  startDate: string;
  endDate: string;
};

export function SyncButton({ startDate, endDate }: Props) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => syncAppleAdsReports(startDate, endDate),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["apple-ads"] });
      toast.success(
        `키워드 ${formatCount(result.keywordRows)}건, 검색어 ${formatCount(result.searchTermRows)}건을 받았습니다.`,
      );
    },
    onError: (caught) => {
      toast.error(
        caught instanceof ApiError ? caught.message : "받아오지 못했습니다.",
      );
    },
  });

  return (
    <PendingButton
      variant="outline"
      pending={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      <RefreshCw data-icon="inline-start" />
      지금 받아오기
    </PendingButton>
  );
}
