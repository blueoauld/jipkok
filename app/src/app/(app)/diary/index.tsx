import { Stack } from "expo-router";
import { NotePencilIcon } from "phosphor-react-native/src/icons/NotePencil";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTokens, Text, YStack } from "tamagui";

import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { RetroCalendar } from "@/components/ui/RetroCalendar";
import { RetroCard } from "@/components/ui/RetroCard";
import { ScreenState } from "@/components/ui/ScreenState";
import { useDiaryMonth } from "@/hooks/useDiaries";
import { useNow } from "@/hooks/useNow";
import type { DiaryResponse } from "@/lib/api";
import {
  formatFullDate,
  fromDateParam,
  koreaDateParam,
  toMonthParam,
} from "@/lib/date";
import { pushOnce } from "@/lib/router";

function DiaryRow({
  diary,
  onPress,
}: {
  diary: DiaryResponse;
  onPress: (entryDate: string) => void;
}) {
  return (
    <RetroCard onPress={() => onPress(diary.entryDate)}>
      <YStack gap="$1">
        <Text fontSize="$4" fontWeight="600">
          {formatFullDate(fromDateParam(diary.entryDate))}
        </Text>
        <Text theme="gray" color="$color11" fontSize="$3" numberOfLines={2}>
          {diary.content}
        </Text>
      </YStack>
    </RetroCard>
  );
}

export default function DiaryCalendarScreen() {
  const { t } = useTranslation();
  const today = koreaDateParam(useNow());
  const [month, setMonth] = useState(() => toMonthParam(today));
  const { data: diaries, error, refetch } = useDiaryMonth(month);

  const openEntry = useCallback(
    (entryDate: string) => pushOnce(`/diary/${entryDate}`),
    [],
  );
  const openToday = useCallback(() => openEntry(today), [openEntry, today]);

  const screenOptions = useMemo(
    () => ({
      title: t("list.diaries"),
      headerRight: () => (
        <HeaderSoloIconButton
          icon={NotePencilIcon}
          label={t("diary.writeToday")}
          onPress={openToday}
        />
      ),
    }),
    [openToday, t],
  );

  const markedDates = useMemo(
    () =>
      Object.fromEntries(
        (diaries ?? []).map((diary) => [diary.entryDate, { marked: true }]),
      ),
    [diaries],
  );
  const rows = useMemo(
    () => (diaries ? [...diaries].reverse() : []),
    [diaries],
  );
  const contentStyle = useMemo(() => {
    const space = getTokens().space;

    return { padding: space.$4.val, gap: space.$4.val };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

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
    </SafeAreaView>
  );
}
