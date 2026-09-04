import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { memo } from "react";
import { Text, XStack } from "tamagui";

import { RetroCard } from "@/components/ui/RetroCard";
import { WorryCount } from "@/components/worry/WorryCount";
import { WorryPostHeader } from "@/components/worry/WorryPostHeader";
import type { WorryPostResponse } from "@/lib/api";

const CONTENT_MAX_LINES = 3;
const COUNT_ICON_SIZE = 16;

function Card({
  worry,
  onPress,
}: {
  worry: WorryPostResponse;
  onPress: (worryId: number) => void;
}) {
  return (
    <RetroCard gap="$2.5" onPress={() => onPress(worry.worryId)}>
      <WorryPostHeader post={worry} />

      <Text fontSize="$4" numberOfLines={CONTENT_MAX_LINES}>
        {worry.content}
      </Text>

      <XStack gap="$4">
        <WorryCount
          icon={HeartIcon}
          value={worry.likeCount}
          size={COUNT_ICON_SIZE}
        />
        <WorryCount
          icon={ChatCircleIcon}
          value={worry.commentCount}
          size={COUNT_ICON_SIZE}
        />
      </XStack>
    </RetroCard>
  );
}

export const WorryCard = memo(Card);
