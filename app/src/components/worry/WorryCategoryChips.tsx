import { XStack } from "tamagui";

import { Button } from "@/components/ui/Button";
import { type ChipItem, ChipScroller } from "@/components/ui/ChipScroller";
import type { WorryCategory } from "@/lib/api";
import i18n from "@/lib/i18n";
import { WORRY_CATEGORIES, worryCategoryLabel } from "@/lib/worry";

const ALL = "ALL";

const FILTER_ITEMS: ChipItem<WorryCategory | typeof ALL>[] = [
  { value: ALL, label: i18n.t("component.all") },
  ...WORRY_CATEGORIES.map((category) => ({
    value: category,
    label: worryCategoryLabel(category),
  })),
];

/** 목록 위에 놓는 필터다. 화면 폭을 넘겨 옆으로 넘겨 보게 둔다. */
export function WorryCategoryFilter({
  value,
  onChange,
}: {
  value: WorryCategory | null;
  onChange: (category: WorryCategory | null) => void;
}) {
  return (
    <ChipScroller
      items={FILTER_ITEMS}
      value={value ?? ALL}
      onChange={(next) => onChange(next === ALL ? null : next)}
    />
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
        <Button
          key={category}
          size="medium"
          variant={value === category ? "dark" : "secondary"}
          accessibilityState={{ selected: value === category }}
          onPress={() => onChange(category)}
        >
          {worryCategoryLabel(category)}
        </Button>
      ))}
    </XStack>
  );
}
