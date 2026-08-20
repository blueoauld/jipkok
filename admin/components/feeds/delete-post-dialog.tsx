"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteFeedPost } from "@/lib/api/feed-reports";
import { ApiError } from "@/lib/api/client";

type Props = {
  postId: number;
  authorNickname: string;
  disabled?: boolean;
};

export function DeletePostDialog({ postId, authorNickname, disabled }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => deleteFeedPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-reports"] });
      setOpen(false);
    },
    onError: (caught) => {
      setError(
        caught instanceof ApiError ? caught.message : "삭제하지 못했습니다.",
      );
    },
  });

  const change = (next: boolean) => {
    setOpen(next);
    if (next) {
      setError(null);
      mutation.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={change}>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => change(true)}
      >
        삭제
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>피드 삭제</DialogTitle>
          <DialogDescription>
            {authorNickname}의 피드 #{postId}을 삭제합니다. 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => change(false)}>
            취소
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "삭제 중" : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
