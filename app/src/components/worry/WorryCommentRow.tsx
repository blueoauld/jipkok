import { ArrowBendDownRightIcon } from "phosphor-react-native/src/icons/ArrowBendDownRight";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme, XStack, YStack } from "tamagui";

import { RelativeTime } from "@/components/ui/RelativeTime";
import { Text } from "@/components/ui/Text";
import { RowAction } from "@/components/worry/RowAction";
import { useContentTranslation } from "@/hooks/useContentTranslation";
import type { WorryCommentResponse } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { LIST_ROW_EVEN_PADDING_Y, SCREEN_PADDING } from "@/lib/design";
import { commentLabel, deletedCommentLabel } from "@/lib/worry";

const REPLY_ROW_ICON_SIZE = 18;
const REPLY_ICON_TOP = 2;
const REPLY_INDENT = SCREEN_PADDING + 8;

export const WorryCommentRow = memo(function WorryCommentRow({
  comment,
  onReply,
  onRemove,
  onReport,
}: {
  comment: WorryCommentResponse;
  onReply: (comment: WorryCommentResponse) => void;
  onRemove: (commentId: number) => void;
  onReport: (commentId: number) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const active = comment.status === "ACTIVE";
  const reply = comment.parentId != null;
  const copyTarget = active ? comment.content : null;
  const translation = useContentTranslation("WORRY_COMMENT", comment.commentId);

  // 꾹 눌러 복사하는 것뿐이라 누른 것처럼 보일 필요가 없다.
  return (
    <XStack
      pl={reply ? REPLY_INDENT : SCREEN_PADDING}
      pr={SCREEN_PADDING}
      py={LIST_ROW_EVEN_PADDING_Y}
      gap="$2.5"
      onLongPress={
        copyTarget
          ? () => copyText(copyTarget, t("worry.detail.commentCopied"))
          : undefined
      }
    >
      {reply && (
        <YStack self="flex-start" mt={REPLY_ICON_TOP}>
          <ArrowBendDownRightIcon
            size={REPLY_ROW_ICON_SIZE}
            weight="bold"
            color={theme.grey400.val}
          />
        </YStack>
      )}

      <YStack flex={1} gap="$1.5">
        <XStack items="center" justify="space-between">
          <Text
            fontSize="$2"
            lineHeight="$2"
            fontWeight="600"
            color={comment.byAuthor ? "$blue500" : "$grey800"}
          >
            {commentLabel(comment)}
          </Text>
          <RelativeTime at={comment.createdAt} />
        </XStack>

        {active ? (
          <Text preset="body" color="$grey800">
            {translation.contentOf(comment.content)}
          </Text>
        ) : (
          <Text preset="body" color="$grey500">
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
    </XStack>
  );
});
