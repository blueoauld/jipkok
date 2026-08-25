"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  description: string;
  invalidateKeys: string[][];
  action: () => Promise<unknown>;
  disabled?: boolean;
};

export function DeleteDialogButton({
  title,
  description,
  invalidateKeys,
  action,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        삭제
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel="삭제"
        errorFallback="삭제하지 못했습니다."
        invalidateKeys={invalidateKeys}
        action={action}
      />
    </>
  );
}
