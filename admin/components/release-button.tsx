"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PendingButton } from "@/components/pending-button";
import { ApiError } from "@/lib/api/client";
import { releaseSuspension } from "@/lib/api/suspensions";
import type { SuspensionType } from "@/lib/types";

type Props = {
  memberId: number;
  type: SuspensionType;
};

export function ReleaseButton({ memberId, type }: Props) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => releaseSuspension(memberId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suspensions"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (caught) => {
      toast.error(
        caught instanceof ApiError ? caught.message : "해제하지 못했습니다.",
      );
    },
  });

  return (
    <PendingButton
      variant="outline"
      size="sm"
      pending={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      해제
    </PendingButton>
  );
}
