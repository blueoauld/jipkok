import { Text, XStack } from "tamagui";

import type { ChatReactionResponse } from "@/lib/api";
import { groupReactions } from "@/lib/chat/reactions";
import { PRESS_OPACITY, RETRO_BORDER_WIDTH } from "@/lib/design";

const CHIP_GAP = 2;
const CHIP_FONT_SIZE = 12;
const CHIP_SIZE = 24;

function ReactionChip({
  emoji,
  count,
  reacted,
  onPress,
}: {
  emoji: string;
  count: number;
  reacted: boolean;
  onPress: () => void;
}) {
  return (
    <XStack
      height={CHIP_SIZE}
      width={count === 1 ? CHIP_SIZE : undefined}
      px={count === 1 ? 0 : "$1.5"}
      items="center"
      justify="center"
      borderWidth={RETRO_BORDER_WIDTH}
      borderColor="$gray12"
      bg={reacted ? "$blue10" : "$color1"}
      pressStyle={{ opacity: PRESS_OPACITY }}
      onPress={onPress}
    >
      <Text fontSize={CHIP_FONT_SIZE} color={reacted ? "$onFill" : "$color12"}>
        {count === 1 ? emoji : `${emoji} ${count}`}
      </Text>
    </XStack>
  );
}

export function ReactionChips({
  reactions,
  mine,
  myMemberId,
  onPress,
}: {
  reactions: ChatReactionResponse[];
  mine: boolean;
  myMemberId: number;
  onPress: () => void;
}) {
  const groups = groupReactions(reactions, myMemberId);

  return (
    <XStack
      self={mine ? "flex-end" : "flex-start"}
      mt={CHIP_GAP}
      gap={CHIP_GAP}
    >
      {groups.map(({ emoji, count, reacted }) => (
        <ReactionChip
          key={emoji}
          emoji={emoji}
          count={count}
          reacted={reacted}
          onPress={onPress}
        />
      ))}
    </XStack>
  );
}
