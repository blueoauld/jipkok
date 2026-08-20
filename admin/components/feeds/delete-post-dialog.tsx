"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteFeedPost } from "@/lib/api/feed-reports";

type Props = {
  postId: number;
  authorNickname: string;
  disabled?: boolean;
};

export function DeletePostDialog({ postId, authorNickname, disabled }: Props) {
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
        title="피드 삭제"
        description={`${authorNickname}의 피드 #${postId}을 삭제합니다. 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        pendingLabel="삭제 중"
        errorFallback="삭제하지 못했습니다."
        invalidateKeys={[["feed-reports"]]}
        action={() => deleteFeedPost(postId)}
      />
    </>
  );
}
