import { useState } from "react";
import { useTranslation } from "react-i18next";
import { XStack } from "tamagui";

import { PillInput } from "@/components/ui/PillInput";
import { SendButton } from "@/components/ui/SendButton";
import type { WorryCommentResponse } from "@/lib/api";
import {
  INPUT_BAR_GAP,
  INPUT_BAR_PADDING_X,
  INPUT_BAR_PADDING_Y,
  KEYBOARD_OVERLAP,
} from "@/lib/design";
import { WORRY_COMMENT_MAX_LENGTH } from "@/lib/validation";

export function WorryCommentComposer({
  replyTo,
  pending,
  onSubmit,
}: {
  replyTo: WorryCommentResponse | null;
  pending: boolean;
  onSubmit: (content: string) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [content, setContent] = useState("");

  const trimmed = content.trim();
  const sendable = trimmed.length > 0 && !pending;

  const submit = () => {
    setContent("");
    // 실패를 기다리는 동안 다음 댓글을 적고 있었을 수 있다. 빈 칸만 되돌린다.
    onSubmit(trimmed).catch(() =>
      setContent((current) => (current.length > 0 ? current : trimmed)),
    );
  };

  return (
    <XStack
      px={INPUT_BAR_PADDING_X}
      pt={INPUT_BAR_PADDING_Y}
      pb={INPUT_BAR_PADDING_Y + KEYBOARD_OVERLAP}
      mb={-KEYBOARD_OVERLAP}
      gap={INPUT_BAR_GAP}
      items="flex-end"
      bg="$background"
    >
      {/* 답글 대상이 바뀔 때 입력창을 새로 띄워 키보드를 함께 연다. */}
      <PillInput
        key={replyTo?.commentId ?? "comment"}
        value={content}
        onChangeText={setContent}
        autoFocus={replyTo !== null}
        placeholder={
          replyTo
            ? t("worry.detail.replyPlaceholder")
            : t("worry.detail.commentPlaceholder")
        }
        maxLength={WORRY_COMMENT_MAX_LENGTH}
      />

      <SendButton
        label={t("worry.detail.submit")}
        sendable={sendable}
        pending={pending}
        onPress={submit}
      />
    </XStack>
  );
}
