import { ArrowBendDownRightIcon } from "phosphor-react-native/src/icons/ArrowBendDownRight";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { RelativeTime } from "@/components/ui/RelativeTime";
import { RetroListRow } from "@/components/ui/RetroListPanel";
import { RowAction } from "@/components/worry/RowAction";
import { useContentTranslation } from "@/hooks/useContentTranslation";
import type { WorryCommentResponse } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { useAccentToken } from "@/lib/theme/accent";
import { commentLabel, deletedCommentLabel } from "@/lib/worry";

const REPLY_ROW_ICON_SIZE = 18;
const REPLY_ICON_TOP = 2;
const REPLY_INDENT = "$5";

export const WorryCommentRow = memo(function WorryCommentRow({
  comment,
  divider,
  onReply,
  onRemove,
  onReport,
}: {
  comment: WorryCommentResponse;
  divider: boolean;
  onReply: (comment: WorryCommentResponse) => void;
  onRemove: (commentId: number) => void;
  onReport: (commentId: number) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const accentToken = useAccentToken();
  const active = comment.status === "ACTIVE";
  const reply = comment.parentId != null;
  const copyTarget = active ? comment.content : null;
  const translation = useContentTranslation("WORRY_COMMENT", comment.commentId);

  return (
    <RetroListRow
      divider={divider}
      pl={reply ? REPLY_INDENT : "$4"}
      gap="$2.5"
      onLongPress={
        copyTarget
          ? () => copyText(copyTarget, t("worry.detail.commentCopied"))
          : undefined
      }
      // 꾹 눌러 복사하는 것뿐이라 누른 것처럼 보일 필요가 없다.
      pressStyle={undefined}
    >
      {reply && (
        <YStack self="flex-start" mt={REPLY_ICON_TOP}>
          <ArrowBendDownRightIcon
            size={REPLY_ROW_ICON_SIZE}
            weight="bold"
            color={theme.gray11.val}
          />
        </YStack>
      )}

      <YStack flex={1} gap="$1.5">
        <XStack items="center" justify="space-between">
          <Text
            fontSize="$3"
            fontWeight="700"
            color={comment.byAuthor ? accentToken : "$color12"}
          >
            {commentLabel(comment)}
          </Text>
          <RelativeTime at={comment.createdAt} />
        </XStack>

        {active ? (
          <Text fontSize="$4">{translation.contentOf(comment.content)}</Text>
        ) : (
          <Text theme="gray" color="$color11" fontSize="$4">
            {deletedCommentLabel(comment)}
          </Text>
        )}

        {active && (
          <XStack self="flex-end" gap="$4">
            <RowAction
              label={translation.label}
              disabled={translation.pending}
              onPress={translation.toggle}
            />
            {!reply && (
              <RowAction
                label={t("worry.detail.reply")}
                onPress={() => onReply(comment)}
              />
            )}
            {comment.mine ? (
              <RowAction
                label={t("action.delete")}
                destructive
                onPress={() => onRemove(comment.commentId)}
              />
            ) : (
              <RowAction
                label={t("action.report")}
                destructive
                onPress={() => onReport(comment.commentId)}
              />
            )}
          </XStack>
        )}
      </YStack>
    </RetroListRow>
  );
});
