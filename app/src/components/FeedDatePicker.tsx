import { useState } from "react";
import { Calendar, type DateData, LocaleConfig } from "react-native-calendars";
import { getTokens, Text, useTheme, XStack, YStack } from "tamagui";

import { SCROLL_TO_TOP_BOTTOM_GAP } from "@/components/ScrollToTopButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { formatDateLabel, fromDateParam, toDateParam } from "@/lib/date";
import { FLOATING_BUTTON_SIZE, OVERLAY_BG } from "@/lib/design";
import {
  useAccent,
  useAccentToken,
  useThemeBackground,
} from "@/lib/theme/accent";

const MONTH_NAMES = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

const DAY_NAMES = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
];

LocaleConfig.locales.ko = {
  monthNames: MONTH_NAMES,
  monthNamesShort: MONTH_NAMES,
  dayNames: DAY_NAMES,
  dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
  today: "오늘",
};

LocaleConfig.defaultLocale = "ko";

const DAY_SIZE = 36;

function DateButton({ date, onPress }: { date: Date; onPress: () => void }) {
  const accent = useAccent();

  return (
    <RetroCard
      theme={accent}
      shadow="$gray12"
      bg="$color10"
      pressBg="$color11"
      height={FLOATING_BUTTON_SIZE}
      px="$4"
      py={0}
      justify="center"
      onPress={onPress}
    >
      <Text fontSize="$4" color="white">
        {formatDateLabel(date)}
      </Text>
    </RetroCard>
  );
}

function CalendarDay({
  date,
  state,
  marking,
  onPress,
}: {
  date?: DateData;
  state?: string;
  marking?: { selected?: boolean };
  onPress?: (date?: DateData) => void;
}) {
  const selected = state === "selected" || Boolean(marking?.selected);
  const disabled = state === "disabled";
  const today = state === "today";
  const accent = useAccentToken();

  return (
    <XStack
      width={DAY_SIZE}
      height={DAY_SIZE}
      items="center"
      justify="center"
      bg={selected ? accent : "transparent"}
      onPress={disabled ? undefined : () => onPress?.(date)}
    >
      <Text
        fontSize="$4"
        fontWeight={selected || today ? "700" : "400"}
        color={
          selected
            ? "white"
            : disabled
              ? "$color8"
              : today
                ? accent
                : "$color12"
        }
      >
        {date?.day}
      </Text>
    </XStack>
  );
}

export function FeedDatePicker({
  date,
  onChange,
}: {
  date: Date;
  onChange: (date: Date) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const background = useThemeBackground();
  const selected = toDateParam(date);

  return (
    <>
      <XStack
        position="absolute"
        b={SCROLL_TO_TOP_BOTTOM_GAP}
        l={0}
        r={0}
        justify="center"
      >
        <DateButton date={date} onPress={() => setOpen(true)} />
      </XStack>

      {open && (
        <>
          <YStack fullscreen bg={OVERLAY_BG} onPress={() => setOpen(false)} />

          <YStack
            position="absolute"
            b={0}
            l={0}
            r={0}
            pt="$2"
            pb={getTokens().space.$4.val}
            bg={background}
            borderTopWidth={2}
            borderColor="$color12"
          >
            <Calendar
              initialDate={selected}
              maxDate={toDateParam(new Date())}
              markedDates={{ [selected]: { selected: true } }}
              monthFormat="yyyy년 M월"
              showSixWeeks
              dayComponent={CalendarDay}
              onDayPress={(day) => {
                setOpen(false);
                onChange(fromDateParam(day.dateString));
              }}
              theme={{
                calendarBackground: "transparent",
                monthTextColor: theme.color12.val,
                textMonthFontWeight: "700",
                textSectionTitleColor: theme.color11.val,
                arrowColor: theme.color12.val,
                disabledArrowColor: theme.color8.val,
              }}
            />
          </YStack>
        </>
      )}
    </>
  );
}
