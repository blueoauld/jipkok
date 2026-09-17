import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTokens, Sheet, Text, XStack, YStack } from "tamagui";

import { Button } from "@/components/ui/Button";
import { RetroRangeSlider } from "@/components/ui/RetroRangeSlider";
import { RetroSegmentedControl } from "@/components/ui/RetroSegmentedControl";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useCloseOnGoBack } from "@/hooks/useCloseOnGoBack";
import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
import { OVERLAY_BG, RETRO_BORDER_WIDTH, TRANSITION } from "@/lib/design";
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
  genderFilterLabel,
} from "@/lib/member";
import { MAX_AGE, MIN_AGE } from "@/lib/validation";

function genderFilterOf(gender: MemberFilter["gender"]): GenderFilter {
  return (
    GENDER_FILTERS.find((value) => GENDER_FILTER_VALUES[value] === gender) ??
    "ALL"
  );
}

const GENDER_FILTER_ITEMS = GENDER_FILTERS.map((value) => ({
  value,
  label: genderFilterLabel(value),
}));

export function MemberFilterSheet({
  open: requested,
  onOpenChange,
  filter,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: MemberFilter;
  onApply: (filter: MemberFilter) => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const open = useVisibleWhenUnlocked(requested);
  const [gender, setGender] = useState(genderFilterOf(filter.gender));
  const [ages, setAges] = useState<[number, number]>([
    filter.minAge,
    filter.maxAge,
  ]);

  // 빈 목록의 초기화처럼 시트 밖에서 필터가 바뀌면 고치던 값이 낡는다. 그대로 두면 다시
  // 열어 적용할 때 방금 지운 필터가 되살아난다.
  const [applied, setApplied] = useState(filter);

  if (applied !== filter) {
    setApplied(filter);
    setGender(genderFilterOf(filter.gender));
    setAges([filter.minAge, filter.maxAge]);
  }

  // 적용하지 않고 닫으면 고치던 값을 버리고 현재 필터로 되돌린다.
  const changeOpen = (next: boolean) => {
    if (!next) {
      setGender(genderFilterOf(filter.gender));
      setAges([filter.minAge, filter.maxAge]);
    }

    onOpenChange(next);
  };

  useCloseOnGoBack(open, () => changeOpen(false));

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
    setGender("ALL");
    setAges([DEFAULT_MEMBER_FILTER.minAge, DEFAULT_MEMBER_FILTER.maxAge]);
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={changeOpen}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      transition={TRANSITION}
    >
      <Sheet.Overlay
        bg={OVERLAY_BG}
        transition={TRANSITION}
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />

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
          <SectionLabel>{t("component.genderLabel")}</SectionLabel>
          <RetroSegmentedControl
            items={GENDER_FILTER_ITEMS}
            value={gender}
            onChange={setGender}
          />
        </YStack>

        <YStack gap="$3">
          <XStack items="center" justify="space-between">
            <SectionLabel>{t("component.ageLabel")}</SectionLabel>
            {/* ~ 글자가 대체 폰트로 그려져 줄높이를 키우므로 고정한다. */}
            <Text fontSize="$2" lineHeight="$2" fontWeight="600">
              {formatAgeRange(ages[0], ages[1])}
            </Text>
          </XStack>
          <RetroRangeSlider
            min={MIN_AGE}
            max={MAX_AGE}
            values={ages}
            lowerLabel={t("a11y.minAge")}
            upperLabel={t("a11y.maxAge")}
            onChange={setAges}
          />
        </YStack>

        <XStack gap="$3">
          <Button
            variant="secondary"
            flex={1}
            disabled={isDefaultMemberFilter(draft)}
            onPress={reset}
          >
            {t("component.reset")}
          </Button>
          <Button flex={1} onPress={apply}>
            {t("component.apply")}
          </Button>
        </XStack>
      </Sheet.Frame>
    </Sheet>
  );
}
