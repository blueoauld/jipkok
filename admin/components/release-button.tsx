"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
    <Button
      variant="outline"
      size="sm"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? "해제 중" : "해제"}
    </Button>
  );
}
