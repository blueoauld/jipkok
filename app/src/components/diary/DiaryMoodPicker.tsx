import { ScrollView } from "react-native";
import { XStack, YStack } from "tamagui";

import { Text } from "@/components/ui/Text";
import type { DiaryMood } from "@/lib/api";
import { BUTTON_SIZES, DARK_FILL, PRESS_DIM } from "@/lib/design";
import { DIARY_MOODS, moodEmoji } from "@/lib/diary";

// 이모지를 크게 넣으려고 Button 대신 직접 그린다. 크기와 모서리는 TDS large 버튼, 색과 눌림은
// 고민 카테고리 칩(Button)과 같다.
const CHIP_SIZE = BUTTON_SIZES.large.height;
const CHIP_RADIUS = BUTTON_SIZES.large.radius;
const EMOJI_FONT_SIZE = 24;

function MoodChip({
  mood,
  selected,
  onPress,
}: {
  mood: DiaryMood;
  selected: boolean;
  onPress: () => void;
}) {
  const emoji = moodEmoji(mood) ?? "";

  return (
    <XStack
      group
      width={CHIP_SIZE}
      height={CHIP_SIZE}
      rounded={CHIP_RADIUS}
      bg={selected ? DARK_FILL : "$greyOpacity100"}
      items="center"
      justify="center"
      overflow="hidden"
      accessible
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={emoji}
      onPress={onPress}
    >
      <Text fontSize={EMOJI_FONT_SIZE} lineHeight={CHIP_SIZE}>
        {emoji}
      </Text>

      <YStack
        fullscreen
        bg={PRESS_DIM}
        opacity={0}
        pointerEvents="none"
        $group-press={{ opacity: 1 }}
      />
    </XStack>
  );
}

/** 하나만 고르고, 고른 걸 다시 누르면 푼다. */
export function DiaryMoodPicker({
  value,
  onChange,
}: {
  value: DiaryMood | null;
  onChange: (mood: DiaryMood | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <XStack gap="$2">
        {DIARY_MOODS.map((mood) => (
          <MoodChip
            key={mood}
            mood={mood}
            selected={value === mood}
            onPress={() => onChange(value === mood ? null : mood)}
          />
        ))}
      </XStack>
    </ScrollView>
  );
}
