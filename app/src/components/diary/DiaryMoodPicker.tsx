import { ScrollView } from "react-native";
import { Text, XStack } from "tamagui";

import { RetroPressable } from "@/components/ui/RetroPressable";
import type { DiaryMood } from "@/lib/api";
import { RETRO_SHADOW_OFFSET_SM } from "@/lib/design";
import { DIARY_MOODS, moodEmoji } from "@/lib/diary";
import { useAccent } from "@/lib/theme/accent";

const CHIP_SIZE = 44;
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
  const accent = useAccent();
  const emoji = moodEmoji(mood) ?? "";

  return (
    <RetroPressable
      theme={selected ? accent : "gray"}
      shadow="$gray8"
      offset={RETRO_SHADOW_OFFSET_SM}
      width={CHIP_SIZE}
      height={CHIP_SIZE}
      bg={selected ? "$color10" : "$color1"}
      pressBg={selected ? "$color11" : "$color3"}
      items="center"
      justify="center"
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={emoji}
      onPress={onPress}
    >
      <Text fontSize={EMOJI_FONT_SIZE} lineHeight={CHIP_SIZE}>
        {emoji}
      </Text>
    </RetroPressable>
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
      <XStack gap="$2" pr={RETRO_SHADOW_OFFSET_SM} pb={RETRO_SHADOW_OFFSET_SM}>
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
