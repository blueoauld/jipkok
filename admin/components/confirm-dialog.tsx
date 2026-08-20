"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PendingButton } from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  errorFallback: string;
  invalidateKeys: string[][];
  action: () => Promise<unknown>;
  onSuccess?: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  errorFallback,
  invalidateKeys,
  action,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: action,
    onSuccess: () => {
      invalidateKeys.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      );
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (caught) => {
      setError(caught instanceof ApiError ? caught.message : errorFallback);
    },
  });

  const change = (next: boolean) => {
    onOpenChange(next);
    if (next) {
      setError(null);
      mutation.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => change(false)}>
            취소
          </Button>
          <PendingButton
            variant="destructive"
            pending={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {confirmLabel}
          </PendingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
