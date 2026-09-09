import { Image } from "expo-image";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { getTokens, Text, useTheme, XStack, YStack } from "tamagui";

import { ListEmpty } from "@/components/ui/ListEmpty";
import { type DayMarking, RetroCalendar } from "@/components/ui/RetroCalendar";
import { RetroCard } from "@/components/ui/RetroCard";
import { ScreenState } from "@/components/ui/ScreenState";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { useDiaryMonth } from "@/hooks/useDiaries";
import { useNow } from "@/hooks/useNow";
import type { DiaryResponse } from "@/lib/api";
import {
  formatFullDate,
  fromDateParam,
  koreaDateParam,
  toMonthParam,
} from "@/lib/date";
import { IMAGE_TRANSITION, RETRO_BORDER_WIDTH } from "@/lib/design";
import { moodEmoji } from "@/lib/diary";
import { photoCacheKey } from "@/lib/photo";
import { pushOnce } from "@/lib/router";

const THUMBNAIL_SIZE = 56;

function DiaryRow({
  diary,
  onPress,
}: {
  diary: DiaryResponse;
  onPress: (entryDate: string) => void;
}) {
  const theme = useTheme();
  const emoji = moodEmoji(diary.mood);
  const cover = diary.attachments[0];
  const coverUri = cover ? (cover.thumbnailUrl ?? cover.url) : null;

  return (
    <RetroCard onPress={() => onPress(diary.entryDate)}>
      <XStack items="center" gap="$3">
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600">
            {emoji ? `${emoji} ` : ""}
            {formatFullDate(fromDateParam(diary.entryDate))}
          </Text>
          {diary.content != null && (
            <Text theme="gray" color="$color11" fontSize="$3" numberOfLines={2}>
              {diary.content}
            </Text>
          )}
        </YStack>

        {coverUri && (
          <Image
            source={{ uri: coverUri, cacheKey: photoCacheKey(coverUri) }}
            contentFit="cover"
            transition={IMAGE_TRANSITION}
            style={{
              width: THUMBNAIL_SIZE,
              height: THUMBNAIL_SIZE,
              borderWidth: RETRO_BORDER_WIDTH,
              borderColor: theme.gray12.val,
              backgroundColor: theme.gray12.val,
            }}
          />
        )}
      </XStack>
    </RetroCard>
  );
}

export default function DiaryScreen() {
  const { t } = useTranslation();
  const today = koreaDateParam(useNow());
  const [month, setMonth] = useState(() => toMonthParam(today));
  const { data: diaries, error, refetch } = useDiaryMonth(month);

  const openEntry = useCallback(
    (entryDate: string) => pushOnce(`/diary/${entryDate}`),
    [],
  );
  const markedDates = useMemo(
    () =>
      Object.fromEntries(
        (diaries ?? []).map((diary): [string, DayMarking] => [
          diary.entryDate,
          { marked: true, emoji: moodEmoji(diary.mood) ?? undefined },
        ]),
      ),
    [diaries],
  );
  const rows = useMemo(
    () => (diaries ? [...diaries].reverse() : []),
    [diaries],
  );
  const tabBarOverlay = useTabBarOverlay();
  const contentStyle = useMemo(() => {
    const space = getTokens().space;

    return {
      padding: space.$4.val,
      paddingBottom: space.$4.val + tabBarOverlay,
      gap: space.$4.val,
    };
  }, [tabBarOverlay]);

  return (
    <YStack flex={1}>
      <FlatList
        data={rows}
        keyExtractor={(diary) => diary.entryDate}
        renderItem={({ item }) => <DiaryRow diary={item} onPress={openEntry} />}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <RetroCalendar
            initialDate={today}
            maxDate={today}
            markedDates={markedDates}
            onDayPress={(day) => openEntry(day.dateString)}
            onMonthChange={(day) => setMonth(toMonthParam(day.dateString))}
          />
        }
        ListEmptyComponent={
          diaries ? (
            <ListEmpty>{t("diary.empty")}</ListEmpty>
          ) : (
            <ScreenState
              error={error}
              message={t("diary.loadFailed")}
              onRetry={() => refetch()}
            />
          )
        }
      />
    </YStack>
  );
}
