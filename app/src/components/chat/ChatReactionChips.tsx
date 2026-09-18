import { useTranslation } from "react-i18next";
import { XStack } from "tamagui";

import { Text } from "@/components/ui/Text";
import type { ChatReactionResponse, ChatReactionType } from "@/lib/api";
import { groupReactions } from "@/lib/chat/reactions";
import { PILL_RADIUS, PRESS_OPACITY, tapSlop } from "@/lib/design";

const CHIP_GAP = 4;
const CHIP_FONT_SIZE = 12;
const CHIP_SIZE = 24;

const TAP_SLOP = tapSlop({ width: CHIP_SIZE, height: CHIP_SIZE });

function ReactionChip({
  type,
  emoji,
  count,
  reacted,
  onPress,
}: {
  type: ChatReactionType;
  emoji: string;
  count: number;
  reacted: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();

  return (
    <XStack
      height={CHIP_SIZE}
      width={count === 1 ? CHIP_SIZE : undefined}
      px={count === 1 ? 0 : "$2"}
      items="center"
      justify="center"
      rounded={PILL_RADIUS}
      bg={reacted ? "$blue50" : "$greyOpacity100"}
      pressStyle={{ opacity: PRESS_OPACITY }}
      hitSlop={TAP_SLOP}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${t(`a11y.reaction${type}`)} ${count}`}
      accessibilityState={{ selected: reacted }}
      onPress={onPress}
    >
      <Text fontSize={CHIP_FONT_SIZE} color={reacted ? "$blue600" : "$grey700"}>
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
      {groups.map(({ type, emoji, count, reacted }) => (
        <ReactionChip
          key={emoji}
          type={type}
          emoji={emoji}
          count={count}
          reacted={reacted}
          onPress={onPress}
        />
      ))}
    </XStack>
  );
}
