"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteWorryComment, deleteWorryPost } from "@/lib/api/worry-reports";

type Props = {
  postId: number;
  authorNickname: string;
  disabled?: boolean;
};

export function DeleteWorryDialog({ postId, authorNickname, disabled }: Props) {
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
        title="고민 삭제"
        description={`${authorNickname}의 고민 #${postId}을 삭제합니다. 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        errorFallback="삭제하지 못했습니다."
        invalidateKeys={[["worry-reports"]]}
        action={() => deleteWorryPost(postId)}
      />
    </>
  );
}

type CommentProps = {
  commentId: number;
  authorNickname: string;
  disabled?: boolean;
};

export function DeleteWorryCommentDialog({
  commentId,
  authorNickname,
  disabled,
}: CommentProps) {
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
        title="고민 댓글 삭제"
        description={`${authorNickname}의 댓글 #${commentId}을 삭제합니다. 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        errorFallback="삭제하지 못했습니다."
        invalidateKeys={[["worry-comment-reports"]]}
        action={() => deleteWorryComment(commentId)}
      />
    </>
  );
}
