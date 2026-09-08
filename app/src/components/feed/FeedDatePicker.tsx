import "@/lib/i18n/calendar";

import { useState } from "react";
import { Calendar, type DateData } from "react-native-calendars";
import { getTokens, Text, useTheme, XStack, YStack } from "tamagui";

import { Glass } from "@/components/ui/Glass";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { formatDateLabel, fromDateParam, toDateParam } from "@/lib/date";
import {
  FLOATING_BUTTON_SIZE,
  OVERLAY_BG,
  PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
  SCROLL_TO_TOP_BOTTOM_GAP,
} from "@/lib/design";
import { GLASS_ENABLED } from "@/lib/glass";
import i18n from "@/lib/i18n";
import {
  useAccent,
  useAccentToken,
  useThemeBackground,
} from "@/lib/theme/accent";

const DAY_SIZE = 36;
const GLASS_TEXT_PADDING = 16;

function DateButton({
  date,
  today,
  onPress,
}: {
  date: Date;
  today: string;
  onPress: () => void;
}) {
  const accent = useAccent();

  // 목록이 아래로 흐르는 자리라 iOS 26에서는 유리 캡슐로 띄운다.
  if (GLASS_ENABLED) {
    return (
      <XStack
        pressStyle={{ opacity: PRESS_OPACITY }}
        accessibilityRole="button"
        onPress={onPress}
      >
        <Glass
          style={{
            height: FLOATING_BUTTON_SIZE,
            borderRadius: FLOATING_BUTTON_SIZE / 2,
            paddingHorizontal: GLASS_TEXT_PADDING,
            alignItems: "center",
            justifyContent: "center",
          }}
          isInteractive
        >
          <Text fontSize="$4" fontWeight="600" color="$color">
            {formatDateLabel(date, today)}
          </Text>
        </Glass>
      </XStack>
    );
  }

  return (
    <XStack
      theme={accent}
      height={FLOATING_BUTTON_SIZE}
      px="$4"
      borderWidth={RETRO_BORDER_WIDTH}
      borderColor="$gray12"
      bg="$color10"
      items="center"
      justify="center"
      pressStyle={{ bg: "$color11" }}
      accessibilityRole="button"
      onPress={onPress}
    >
      <Text fontSize="$4" fontWeight="600" color="$onFill">
        {formatDateLabel(date, today)}
      </Text>
    </XStack>
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
            ? "$onFill"
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
  today,
  onChange,
}: {
  date: Date;
  today: string;
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
        <DateButton date={date} today={today} onPress={() => setOpen(true)} />
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
              maxDate={today}
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
