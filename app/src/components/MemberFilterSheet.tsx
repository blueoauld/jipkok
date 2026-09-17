import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, XStack, YStack } from "tamagui";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  FIELD_TEXT_GAP,
  FIELD_TEXT_INSET,
  SCREEN_PADDING,
  SHEET_PADDING_X,
} from "@/lib/design";
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

// TDS 바텀시트의 두 버튼(BottomSheet.DoubleCTA)에서 잰 값이다.
const CTA_PADDING_TOP = 36;
const CTA_PADDING_BOTTOM = 20;
const CTA_GAP = 8;

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
  const { t } = useTranslation();
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
    <BottomSheet
      open={open}
      onOpenChange={changeOpen}
      title={t("component.filter")}
    >
      <YStack px={SHEET_PADDING_X} gap="$4">
        <YStack gap={FIELD_TEXT_GAP}>
          <FieldLabel>{t("component.genderLabel")}</FieldLabel>
          <SegmentedControl
            items={GENDER_FILTER_ITEMS}
            value={gender}
            onChange={setGender}
          />
        </YStack>

        <YStack gap={FIELD_TEXT_GAP}>
          <XStack items="center" justify="space-between">
            <FieldLabel>{t("component.ageLabel")}</FieldLabel>
            {/* ~ 글자가 대체 폰트로 그려져 줄높이를 키우므로 고정한다. */}
            <Text
              pr={FIELD_TEXT_INSET}
              fontSize="$2"
              lineHeight="$2"
              fontWeight="600"
            >
              {formatAgeRange(ages[0], ages[1])}
            </Text>
          </XStack>
          <RangeSlider
            min={MIN_AGE}
            max={MAX_AGE}
            values={ages}
            lowerLabel={t("a11y.minAge")}
            upperLabel={t("a11y.maxAge")}
            onChange={setAges}
          />
        </YStack>
      </YStack>

      <XStack
        gap={CTA_GAP}
        px={SCREEN_PADDING}
        pt={CTA_PADDING_TOP}
        pb={CTA_PADDING_BOTTOM}
      >
        <Button
          variant="secondary"
          size="xlarge"
          flex={1}
          disabled={isDefaultMemberFilter(draft)}
          onPress={reset}
        >
          {t("component.reset")}
        </Button>
        <Button size="xlarge" flex={1} onPress={apply}>
          {t("component.apply")}
        </Button>
      </XStack>
    </BottomSheet>
  );
}
