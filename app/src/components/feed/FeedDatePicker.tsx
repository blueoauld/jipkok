import { useState } from "react";
import { Calendar, type DateData, LocaleConfig } from "react-native-calendars";
import { getTokens, Text, useTheme, XStack, YStack } from "tamagui";

import { SCROLL_TO_TOP_BOTTOM_GAP } from "@/components/ScrollToTopButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { formatDateLabel, fromDateParam, toDateParam } from "@/lib/date";
import {
  FLOATING_BUTTON_SIZE,
  OVERLAY_BG,
  RETRO_BORDER_WIDTH,
} from "@/lib/design";
import i18n, { currentLocale } from "@/lib/i18n";
import {
  useAccent,
  useAccentToken,
  useThemeBackground,
} from "@/lib/theme/accent";

const KO_MONTHS = [
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

const JA_MONTHS = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

const KO_DAYS = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
];

const JA_DAYS = [
  "日曜日",
  "月曜日",
  "火曜日",
  "水曜日",
  "木曜日",
  "金曜日",
  "土曜日",
];

const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const EN_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const ZH_MONTHS = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

const ZH_DAYS = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
];

// 달력은 i18next가 아니라 라이브러리의 로케일 표를 쓴다.
LocaleConfig.locales.ko = {
  monthNames: KO_MONTHS,
  monthNamesShort: KO_MONTHS,
  dayNames: KO_DAYS,
  dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
  today: "오늘",
};

LocaleConfig.locales.ja = {
  monthNames: JA_MONTHS,
  monthNamesShort: JA_MONTHS,
  dayNames: JA_DAYS,
  dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"],
  today: "今日",
};

LocaleConfig.locales.en = {
  monthNames: EN_MONTHS,
  monthNamesShort: EN_MONTHS,
  dayNames: EN_DAYS,
  dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  today: "Today",
};

LocaleConfig.locales.zh = {
  monthNames: ZH_MONTHS,
  monthNamesShort: ZH_MONTHS,
  dayNames: ZH_DAYS,
  dayNamesShort: ["日", "一", "二", "三", "四", "五", "六"],
  today: "今天",
};

LocaleConfig.defaultLocale = currentLocale();

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
