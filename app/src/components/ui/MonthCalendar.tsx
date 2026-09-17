import "@/lib/i18n/calendar";

import { useCallback } from "react";
import {
  Calendar,
  type CalendarProps,
  type DateData,
} from "react-native-calendars";
import { Text, useTheme, YStack } from "tamagui";

import { formatFullDate, fromDateParam } from "@/lib/date";
import { PILL_RADIUS } from "@/lib/design";
import i18n from "@/lib/i18n";

const DAY_SIZE = 36;
const DOT_SIZE = 4;
const DOT_BOTTOM = 3;
const EMOJI_FONT_SIZE = 22;
const MONTH_FONT_SIZE = 17;
const WEEKDAY_FONT_SIZE = 13;

// 이모지가 있는 날은 숫자 대신 이모지를 그리고 점은 생략한다.
export type DayMarking = {
  selected?: boolean;
  marked?: boolean;
  emoji?: string;
};

type CalendarDayProps = {
  date?: DateData;
  state?: string;
  marking?: DayMarking;
  onPress?: (date?: DateData) => void;
};

function CalendarDay({
  date,
  state,
  marking,
  maxDate,
  onPress,
}: CalendarDayProps & { maxDate?: string }) {
  const selected = state === "selected" || Boolean(marking?.selected);
  // 라이브러리는 maxDate보다 today를 먼저 보고, today는 기기 날짜다. 한국보다 앞선
  // 시간대에서는 아직 오지 않은 날이 눌리는 오늘로 그려지므로 여기서 한 번 더 막는다.
  const beyondMax =
    maxDate !== undefined && date !== undefined && date.dateString > maxDate;
  const disabled = state === "disabled" || beyondMax;
  const today = state === "today" && !beyondMax;
  const weight = disabled ? "400" : selected || today ? "700" : "500";

  return (
    <YStack
      width={DAY_SIZE}
      height={DAY_SIZE}
      rounded={PILL_RADIUS}
      items="center"
      justify="center"
      bg={selected ? "$blue500" : "transparent"}
      accessible
      accessibilityRole="button"
      accessibilityLabel={
        date &&
        [formatFullDate(fromDateParam(date.dateString)), marking?.emoji]
          .filter(Boolean)
          .join(" ")
      }
      accessibilityState={{ selected, disabled }}
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
                ? "$grey300"
                : today
                  ? "$blue500"
                  : "$grey800"
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
          bg={selected ? "$onFill" : "$blue500"}
        />
      )}
    </YStack>
  );
}

export function MonthCalendar(
  props: Pick<
    CalendarProps,
    | "initialDate"
    | "minDate"
    | "maxDate"
    | "markedDates"
    | "showSixWeeks"
    | "onDayPress"
    | "onMonthChange"
  >,
) {
  const theme = useTheme();
  const { maxDate } = props;
  const dayComponent = useCallback(
    (dayProps: CalendarDayProps) => (
      <CalendarDay {...dayProps} maxDate={maxDate} />
    ),
    [maxDate],
  );

  return (
    <Calendar
      {...props}
      monthFormat={i18n.t("component.monthFormat")}
      dayComponent={dayComponent}
      theme={{
        calendarBackground: "transparent",
        monthTextColor: theme.grey800.val,
        textMonthFontSize: MONTH_FONT_SIZE,
        textMonthFontWeight: "700",
        textSectionTitleColor: theme.grey500.val,
        textDayHeaderFontSize: WEEKDAY_FONT_SIZE,
        arrowColor: theme.grey700.val,
        disabledArrowColor: theme.grey300.val,
      }}
    />
  );
}
