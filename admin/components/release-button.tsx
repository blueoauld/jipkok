"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PendingButton } from "@/components/pending-button";
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
