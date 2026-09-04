import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { useTranslation } from "react-i18next";
import { Text, XStack } from "tamagui";

import { RetroCard } from "@/components/ui/RetroCard";
import { RowAction } from "@/components/worry/RowAction";
import { WorryCount } from "@/components/worry/WorryCount";
import { WorryPostHeader } from "@/components/worry/WorryPostHeader";
import { useContentTranslation } from "@/hooks/useContentTranslation";
import type { WorryPostResponse } from "@/lib/api";
import { copyText } from "@/lib/clipboard";

const COUNT_ICON_SIZE = 18;

export function WorryPostSection({
  post,
  onToggleLike,
}: {
  post: WorryPostResponse;
  onToggleLike: () => void;
}) {
  const { t } = useTranslation();
  const translation = useContentTranslation("WORRY_POST", post.worryId);

  return (
    <RetroCard
      gap="$2.5"
      onLongPress={() => copyText(post.content, t("worry.detail.postCopied"))}
    >
      <WorryPostHeader post={post} />

      <Text fontSize="$4">{translation.contentOf(post.content)}</Text>

      <XStack items="center" justify="space-between">
        <XStack gap="$4">
          <WorryCount
            icon={HeartIcon}
            value={post.likeCount}
            size={COUNT_ICON_SIZE}
            active={post.likedByMe}
            onPress={onToggleLike}
          />
          <WorryCount
            icon={ChatCircleIcon}
            value={post.commentCount}
            size={COUNT_ICON_SIZE}
          />
        </XStack>

        <RowAction
          label={translation.label}
          disabled={translation.pending}
          onPress={translation.toggle}
        />
      </XStack>
    </RetroCard>
  );
}
