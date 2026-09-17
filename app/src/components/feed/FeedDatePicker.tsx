import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Glass } from "@/components/ui/Glass";
import { MonthCalendar } from "@/components/ui/MonthCalendar";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { formatDateLabel, fromDateParam, toDateParam } from "@/lib/date";
import {
  FLOATING_BUTTON_SIZE,
  PILL_RADIUS,
  PRESS_OPACITY,
  SCREEN_PADDING,
} from "@/lib/design";
import { GLASS_ENABLED } from "@/lib/glass";

const GLASS_TEXT_PADDING = 16;
// 달력 라이브러리가 좌우에 5씩 여백을 두므로 그만큼 덜 띄워 시트 안쪽 여백에 맞춘다.
const CALENDAR_PADDING_X = 11;
const CALENDAR_PADDING_BOTTOM = 16;

function DateButton({
  date,
  today,
  onPress,
}: {
  date: Date;
  today: string;
  onPress: () => void;
}) {
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
          <Text fontSize="$4" fontWeight="600" color="$grey900">
            {formatDateLabel(date, today)}
          </Text>
        </Glass>
      </XStack>
    );
  }

  return (
    <XStack
      height={FLOATING_BUTTON_SIZE}
      px={GLASS_TEXT_PADDING}
      rounded={PILL_RADIUS}
      bg="$blue500"
      items="center"
      justify="center"
      pressStyle={{ bg: "$blue600" }}
      accessibilityRole="button"
      onPress={onPress}
    >
      <Text fontSize="$4" fontWeight="600" color="$onFill">
        {formatDateLabel(date, today)}
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
  const [open, setOpen] = useState(false);
  const selected = toDateParam(date);
  const tabBarOverlay = useTabBarOverlay();

  return (
    <>
      <XStack
        position="absolute"
        b={tabBarOverlay + SCREEN_PADDING}
        l={0}
        r={0}
        justify="center"
      >
        <DateButton date={date} today={today} onPress={() => setOpen(true)} />
      </XStack>

      <BottomSheet open={open} onOpenChange={setOpen}>
        <YStack px={CALENDAR_PADDING_X} pb={CALENDAR_PADDING_BOTTOM}>
          <MonthCalendar
            initialDate={selected}
            maxDate={today}
            markedDates={{ [selected]: { selected: true } }}
            showSixWeeks
            onDayPress={(day) => {
              setOpen(false);
              onChange(fromDateParam(day.dateString));
            }}
          />
        </YStack>
      </BottomSheet>
    </>
  );
}
