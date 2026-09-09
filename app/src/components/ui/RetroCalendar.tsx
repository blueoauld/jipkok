import "@/lib/i18n/calendar";

import {
  Calendar,
  type CalendarProps,
  type DateData,
} from "react-native-calendars";
import { Text, useTheme, YStack } from "tamagui";

import i18n from "@/lib/i18n";
import { useAccentToken } from "@/lib/theme/accent";

const DAY_SIZE = 36;
const DOT_SIZE = 4;
const DOT_BOTTOM = 3;
const EMOJI_FONT_SIZE = 22;

// 이모지가 있는 날은 숫자 대신 이모지를 그리고 점은 생략한다.
export type DayMarking = {
  selected?: boolean;
  marked?: boolean;
  emoji?: string;
};

function CalendarDay({
  date,
  state,
  marking,
  onPress,
}: {
  date?: DateData;
  state?: string;
  marking?: DayMarking;
  onPress?: (date?: DateData) => void;
}) {
  const selected = state === "selected" || Boolean(marking?.selected);
  const disabled = state === "disabled";
  const today = state === "today";
  const accent = useAccentToken();
  const weight = disabled ? "400" : selected || today ? "700" : "500";

  return (
    <YStack
      width={DAY_SIZE}
      height={DAY_SIZE}
      items="center"
      justify="center"
      bg={selected ? accent : "transparent"}
      onPress={disabled ? undefined : () => onPress?.(date)}
    >
      {marking?.emoji ? (
        <Text fontSize={EMOJI_FONT_SIZE} lineHeight={DAY_SIZE}>
          {marking.emoji}
        </Text>
      ) : (
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
      )}

      {marking?.marked && !marking.emoji && (
        <YStack
          position="absolute"
          b={DOT_BOTTOM}
          width={DOT_SIZE}
          height={DOT_SIZE}
          rounded={DOT_SIZE / 2}
          bg={selected ? "$onFill" : accent}
        />
      )}
    </YStack>
  );
}

export function RetroCalendar(
  props: Pick<
    CalendarProps,
    | "initialDate"
    | "maxDate"
    | "markedDates"
    | "showSixWeeks"
    | "onDayPress"
    | "onMonthChange"
  >,
) {
  const theme = useTheme();

  return (
    <Calendar
      {...props}
      monthFormat={i18n.t("component.monthFormat")}
      dayComponent={CalendarDay}
      theme={{
        calendarBackground: "transparent",
        monthTextColor: theme.color12.val,
        textMonthFontWeight: "700",
        textSectionTitleColor: theme.color11.val,
        arrowColor: theme.color12.val,
        disabledArrowColor: theme.color8.val,
      }}
    />
  );
}
