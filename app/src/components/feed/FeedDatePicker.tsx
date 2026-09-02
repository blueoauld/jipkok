import "@/lib/i18n/calendar";

import { useState } from "react";
import { Calendar, type DateData } from "react-native-calendars";
import { getTokens, Text, useTheme, XStack, YStack } from "tamagui";

import { RetroCard } from "@/components/ui/RetroCard";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { formatDateLabel, fromDateParam, toDateParam } from "@/lib/date";
import {
  FLOATING_BUTTON_SIZE,
  OVERLAY_BG,
  RETRO_BORDER_WIDTH,
  SCROLL_TO_TOP_BOTTOM_GAP,
} from "@/lib/design";
import i18n from "@/lib/i18n";
import {
  useAccent,
  useAccentToken,
  useThemeBackground,
} from "@/lib/theme/accent";

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
      <Text fontSize="$4" fontWeight="700" color="white">
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
  const weight = disabled ? "400" : selected || today ? "700" : "500";

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
        fontWeight={weight}
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
  const tabBarOverlay = useTabBarOverlay();

  return (
    <>
      <XStack
        position="absolute"
        b={tabBarOverlay + SCROLL_TO_TOP_BOTTOM_GAP}
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
            // 떠 있는 탭 바가 이 위에 얹히므로 마지막 줄이 가리지 않게 그만큼 더 비운다.
            pb={getTokens().space.$4.val + tabBarOverlay}
            bg={background}
            borderTopWidth={RETRO_BORDER_WIDTH}
            borderColor="$gray12"
          >
            <Calendar
              initialDate={selected}
              maxDate={toDateParam(new Date())}
              markedDates={{ [selected]: { selected: true } }}
              monthFormat={i18n.t("component.monthFormat")}
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
