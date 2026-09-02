import type { Icon } from "phosphor-react-native";
import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { useTranslation } from "react-i18next";
import { Text, useTheme, XStack } from "tamagui";

import { RelativeTime } from "@/components/ui/RelativeTime";
import { RetroCard } from "@/components/ui/RetroCard";
import { RowAction } from "@/components/worry/RowAction";
import { WorryCategoryTag } from "@/components/worry/WorryCategoryTag";
import { useContentTranslation } from "@/hooks/useContentTranslation";
import type { WorryPostResponse } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { PRESS_OPACITY } from "@/lib/design";

const COUNT_ICON_SIZE = 18;

function CountBadge({
  icon: BadgeIcon,
  value,
  active,
  onPress,
}: {
  icon: Icon;
  value: number;
  active?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <XStack
      items="center"
      gap="$1.5"
      pressStyle={onPress ? { opacity: PRESS_OPACITY } : undefined}
      onPress={onPress}
    >
      <BadgeIcon
        size={COUNT_ICON_SIZE}
        weight={active ? "fill" : "bold"}
        color={active ? theme.red10.val : theme.gray11.val}
      />
      <Text theme="gray" color="$color11" fontSize="$3">
        {value}
      </Text>
    </XStack>
  );
}

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
      <XStack items="center" justify="space-between">
        <XStack items="center" gap="$2">
          <WorryCategoryTag category={post.category} />
          <Text fontSize="$3" fontWeight="700">
            {post.mine ? t("worry.detail.mine") : t("worry.detail.anonymous")}
          </Text>
        </XStack>
        <RelativeTime at={post.createdAt} />
      </XStack>

      <Text fontSize="$4">{translation.contentOf(post.content)}</Text>

      <XStack items="center" justify="space-between">
        <XStack gap="$4">
          <CountBadge
            icon={HeartIcon}
            value={post.likeCount}
            active={post.likedByMe}
            onPress={onToggleLike}
          />
          <CountBadge icon={ChatCircleIcon} value={post.commentCount} />
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
