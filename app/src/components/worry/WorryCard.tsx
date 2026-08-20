import type { Icon } from "phosphor-react-native";
import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { memo } from "react";
import { Text, useTheme, XStack } from "tamagui";

import { RetroCard } from "@/components/ui/RetroCard";
import { formatRelativeTime } from "@/lib/date";

export type WorryPost = {
  worryId: number;
  content: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
};

const CONTENT_MAX_LINES = 3;
const COUNT_ICON_SIZE = 16;

function CardCount({ icon: CountIcon, value }: { icon: Icon; value: number }) {
  const theme = useTheme();

  return (
    <XStack items="center" gap="$1.5">
      <CountIcon
        size={COUNT_ICON_SIZE}
        weight="bold"
        color={theme.gray11.val}
      />
      <Text theme="gray" color="$color11" fontSize="$3">
        {value}
      </Text>
    </XStack>
  );
}

function Card({ worry }: { worry: WorryPost }) {
  return (
    <RetroCard gap="$2.5">
      <XStack items="center" justify="space-between">
        <Text fontSize="$3" fontWeight="700">
          익명
        </Text>
        <Text theme="gray" color="$color11" fontSize="$2">
          {formatRelativeTime(worry.createdAt)}
        </Text>
      </XStack>

      <Text fontSize="$4" numberOfLines={CONTENT_MAX_LINES}>
        {worry.content}
      </Text>

      <XStack gap="$4">
        <CardCount icon={HeartIcon} value={worry.likeCount} />
        <CardCount icon={ChatCircleIcon} value={worry.commentCount} />
      </XStack>
    </RetroCard>
  );
}

export const WorryCard = memo(Card);
