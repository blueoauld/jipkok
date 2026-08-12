import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { getTokens, Text, XStack, YStack } from "tamagui";

import { SCROLL_TO_TOP_BOTTOM_GAP } from "@/components/ScrollToTopButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { formatDateLabel } from "@/lib/date";
import { FLOATING_BUTTON_SIZE, OVERLAY_BG } from "@/lib/design";

const PICKER_LOCALE = "ko-KR";

// 네이티브 달력이 측정되기 전에는 패널이 납작하게 떠서 번쩍인다.
const DATE_PICKER_HEIGHT = 330;

function DateButton({ date, onPress }: { date: Date; onPress: () => void }) {
  return (
    <RetroCard
      theme="blue"
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

export function FeedDatePicker({
  date,
  onChange,
}: {
  date: Date;
  onChange: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);

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
            minH={DATE_PICKER_HEIGHT}
            items="center"
            pt="$2"
            pb={getTokens().space.$4.val}
            bg="$background"
            borderTopWidth={2}
            borderColor="$color12"
          >
            <DateTimePicker
              value={date}
              mode="date"
              display="inline"
              locale={PICKER_LOCALE}
              maximumDate={new Date()}
              onValueChange={(_event, selected) => {
                setOpen(false);
                onChange(selected);
              }}
            />
          </YStack>
        </>
      )}
    </>
  );
}
