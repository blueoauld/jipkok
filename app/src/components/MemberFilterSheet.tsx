import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTokens, Sheet, Text, XStack, YStack } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";
import { RetroRangeSlider } from "@/components/ui/RetroRangeSlider";
import { RetroSegmentedControl } from "@/components/ui/RetroSegmentedControl";
import { OVERLAY_BG, RETRO_BORDER_WIDTH } from "@/lib/design";
import {
  DEFAULT_MEMBER_FILTER,
  isDefaultMemberFilter,
  type MemberFilter,
} from "@/lib/filter/store";
import {
  formatAgeRange,
  GENDER_FILTER_VALUES,
  GENDER_FILTERS,
  type GenderFilter,
} from "@/lib/member";
import { MAX_AGE, MIN_AGE } from "@/lib/validation";

function genderFilterOf(gender: MemberFilter["gender"]): GenderFilter {
  return (
    GENDER_FILTERS.find((label) => GENDER_FILTER_VALUES[label] === gender) ??
    "전체"
  );
}

function Label({ children }: { children: string }) {
  return (
    <Text
      theme="gray"
      color="$color11"
      fontSize="$3"
      lineHeight="$3"
      fontWeight="600"
    >
      {children}
    </Text>
  );
}

export function MemberFilterSheet({
  open,
  onOpenChange,
  filter,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: MemberFilter;
  onApply: (filter: MemberFilter) => void;
}) {
  const insets = useSafeAreaInsets();
  const [gender, setGender] = useState(genderFilterOf(filter.gender));
  const [ages, setAges] = useState<[number, number]>([
    filter.minAge,
    filter.maxAge,
  ]);

  // 적용하지 않고 닫으면 고치던 값을 버리고 현재 필터로 되돌린다.
  const changeOpen = (next: boolean) => {
    if (!next) {
      setGender(genderFilterOf(filter.gender));
      setAges([filter.minAge, filter.maxAge]);
    }

    onOpenChange(next);
  };

  const draft: MemberFilter = {
    gender: GENDER_FILTER_VALUES[gender],
    minAge: ages[0],
    maxAge: ages[1],
  };

  const apply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const reset = () => {
    setGender("전체");
    setAges([DEFAULT_MEMBER_FILTER.minAge, DEFAULT_MEMBER_FILTER.maxAge]);
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={changeOpen}
      snapPointsMode="fit"
      dismissOnSnapToBottom
    >
      <Sheet.Overlay bg={OVERLAY_BG} />

      <Sheet.Frame
        bg="$color1"
        rounded={0}
        borderTopWidth={RETRO_BORDER_WIDTH}
        borderColor="$gray12"
        p="$4"
        pb={getTokens().space.$6.val + insets.bottom}
        gap="$4"
      >
        <YStack gap="$2">
          <Label>성별</Label>
          <RetroSegmentedControl
            values={GENDER_FILTERS}
            value={gender}
            onChange={setGender}
          />
        </YStack>

        <YStack gap="$3">
          <XStack items="center" justify="space-between">
            <Label>나이</Label>
            {/* ~ 글자가 대체 폰트로 그려져 줄높이를 키우므로 고정한다. */}
            <Text fontSize="$3" lineHeight="$3" fontWeight="600">
              {formatAgeRange(ages[0], ages[1])}
            </Text>
          </XStack>
          <RetroRangeSlider
            min={MIN_AGE}
            max={MAX_AGE}
            values={ages}
            onChange={setAges}
          />
        </YStack>

        <XStack gap="$3">
          <RetroButton
            theme="gray"
            flex={1}
            disabled={isDefaultMemberFilter(draft)}
            onPress={reset}
          >
            초기화
          </RetroButton>
          <RetroButton flex={1} onPress={apply}>
            적용
          </RetroButton>
        </XStack>
      </Sheet.Frame>
    </Sheet>
  );
}
