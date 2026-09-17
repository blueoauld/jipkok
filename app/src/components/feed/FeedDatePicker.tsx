import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { MonthCalendar } from "@/components/ui/MonthCalendar";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { formatDateLabel, fromDateParam, toDateParam } from "@/lib/date";
import {
  FLOATING_BUTTON_SIZE,
  PILL_RADIUS,
  SCREEN_PADDING,
} from "@/lib/design";

const BUTTON_PADDING_X = 16;
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
  return (
    <XStack
      height={FLOATING_BUTTON_SIZE}
      px={BUTTON_PADDING_X}
      rounded={PILL_RADIUS}
      bg="$blue500"
      items="center"
      justify="center"
      pressStyle={{ bg: "$blue600" }}
      accessible
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
