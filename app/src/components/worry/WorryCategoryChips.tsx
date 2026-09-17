import { ScrollView } from "react-native";
import { getTokens, Text, XStack } from "tamagui";

import { RetroPressable } from "@/components/ui/RetroPressable";
import type { WorryCategory } from "@/lib/api";
import { RETRO_SHADOW_OFFSET_SM } from "@/lib/design";
import i18n from "@/lib/i18n";
import { WORRY_CATEGORIES, worryCategoryLabel } from "@/lib/worry";

const ALL_LABEL = i18n.t("component.all");

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <RetroPressable
      theme={selected ? "blue" : "gray"}
      shadow="$gray8"
      offset={RETRO_SHADOW_OFFSET_SM}
      px="$3"
      py="$1.5"
      bg={selected ? "$color10" : "$color1"}
      pressBg={selected ? "$color11" : "$color3"}
      items="center"
      justify="center"
      onPress={onPress}
    >
      <Text
        fontSize="$4"
        fontWeight={selected ? "700" : "400"}
        color={selected ? "$onFill" : "$color12"}
      >
        {label}
      </Text>
    </RetroPressable>
  );
}

/** 목록 위에 놓는 필터다. 화면 폭을 넘겨 옆으로 넘겨 보게 둔다. */
export function WorryCategoryFilter({
  value,
  onChange,
}: {
  value: WorryCategory | null;
  onChange: (category: WorryCategory | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: getTokens().space.$4.val,
      }}
    >
      <XStack gap="$2" pb={RETRO_SHADOW_OFFSET_SM}>
        <Chip
          label={ALL_LABEL}
          selected={value === null}
          onPress={() => onChange(null)}
        />

        {WORRY_CATEGORIES.map((category) => (
          <Chip
            key={category}
            label={worryCategoryLabel(category)}
            selected={value === category}
            onPress={() => onChange(category)}
          />
        ))}
      </XStack>
    </ScrollView>
  );
}

/** 작성 화면에서 하나를 고르게 한다. 반드시 골라야 하므로 접지 않고 다 편다. */
export function WorryCategoryPicker({
  value,
  onChange,
}: {
  value: WorryCategory | null;
  onChange: (category: WorryCategory) => void;
}) {
  return (
    <XStack flexWrap="wrap" gap="$2">
      {WORRY_CATEGORIES.map((category) => (
        <Chip
          key={category}
          label={worryCategoryLabel(category)}
          selected={value === category}
          onPress={() => onChange(category)}
        />
      ))}
    </XStack>
  );
}
