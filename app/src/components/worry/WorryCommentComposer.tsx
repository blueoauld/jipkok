import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getTokens, XStack, YStack } from "tamagui";

import { Button } from "@/components/ui/Button";
import { RetroInput } from "@/components/ui/RetroInput";
import type { WorryCommentResponse } from "@/lib/api";
import { KEYBOARD_OVERLAP } from "@/lib/design";
import { WORRY_COMMENT_MAX_LENGTH } from "@/lib/validation";

const SUBMIT_BUTTON_WIDTH = 80;

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

  return (
    <XStack
      px="$4"
      pt="$3"
      pb={getTokens().space.$3.val + KEYBOARD_OVERLAP}
      mb={-KEYBOARD_OVERLAP}
      gap="$3"
      items="center"
      bg="$background"
    >
      <YStack flex={1}>
        {/* 답글 대상이 바뀔 때 입력창을 새로 띄워 키보드를 함께 연다. */}
        <RetroInput
          key={replyTo?.commentId ?? "comment"}
          value={content}
          onChangeText={setContent}
          autoFocusNative={replyTo !== null}
          placeholder={
            replyTo
              ? t("worry.detail.replyPlaceholder")
              : t("worry.detail.commentPlaceholder")
          }
          maxLength={WORRY_COMMENT_MAX_LENGTH}
        />
      </YStack>
      <Button
        width={SUBMIT_BUTTON_WIDTH}
        disabled={!trimmed}
        loading={pending}
        onPress={() => {
          setContent("");
          // 실패를 기다리는 동안 다음 댓글을 적고 있었을 수 있다. 빈 칸만 되돌린다.
          onSubmit(trimmed).catch(() =>
            setContent((current) => (current.length > 0 ? current : trimmed)),
          );
        }}
      >
        {t("worry.detail.submit")}
      </Button>
    </XStack>
  );
}
