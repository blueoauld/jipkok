"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FilterSelect } from "@/components/filter-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createSuspension } from "@/lib/api/suspensions";
import { ApiError } from "@/lib/api/client";
import { suspensionReasonLabels, suspensionTypeLabels } from "@/lib/labels";
import type { SuspensionReason, SuspensionType } from "@/lib/types";

type Props = {
  memberId: number;
  nickname: string;
  disabled?: boolean;
};

export function SuspendDialog({ memberId, nickname, disabled }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<SuspensionType>("SERVICE");
  const [reason, setReason] = useState<SuspensionReason>("ABUSE");
  const [days, setDays] = useState("");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createSuspension({
        memberId,
        type,
        reason,
        days: days ? Number(days) : undefined,
        detail: detail.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suspensions"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
    },
    onError: (caught) => {
      setError(
        caught instanceof ApiError ? caught.message : "정지하지 못했습니다.",
      );
    },
  });

  const change = (next: boolean) => {
    setOpen(next);
    if (next) {
      setDays("");
      setDetail("");
      setError(null);
      mutation.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={change}>
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => change(true)}
      >
        정지
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회원 정지</DialogTitle>
          <DialogDescription>
            {nickname} #{memberId}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <FilterSelect
              items={suspensionTypeLabels}
              value={type}
              onChange={setType}
            />
            <FilterSelect
              items={suspensionReasonLabels}
              value={reason}
              onChange={setReason}
            />
          </div>
          <Input
            inputMode="numeric"
            placeholder="정지 일수 (비우면 영구)"
            value={days}
            onChange={(event) => setDays(event.target.value.replace(/\D/g, ""))}
          />
          <Textarea
            placeholder="상세 사유 (선택)"
            maxLength={500}
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => change(false)}>
            취소
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "정지 중" : "정지"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
