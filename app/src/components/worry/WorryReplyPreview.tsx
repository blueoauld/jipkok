import { useTranslation } from "react-i18next";
import { YStack } from "tamagui";

import { ReplyPreviewBox } from "@/components/ui/ReplyPreviewBox";
import type { WorryCommentResponse } from "@/lib/api";
import { commentLabel } from "@/lib/worry";

export function WorryReplyPreview({
  replyTo,
  onCancel,
}: {
  replyTo: WorryCommentResponse;
  onCancel: () => void;
}) {
  const { t } = useTranslation();

  return (
    <YStack bg="$background">
      <ReplyPreviewBox
        title={t("worry.detail.replyTo", { name: commentLabel(replyTo) })}
        summary={replyTo.content ?? ""}
        onCancel={onCancel}
      />
    </YStack>
  );
}
