import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { DiaryEditor } from "@/components/diary/DiaryEditor";
import { DiaryReadScreen } from "@/components/diary/DiaryReadScreen";
import { ScreenState } from "@/components/ui/ScreenState";
import { useDiaryMonth } from "@/hooks/useDiaries";
import type { DiaryResponse } from "@/lib/api";
import { formatFullDate, fromDateParam, toMonthParam } from "@/lib/date";

function DiaryEntry({
  entryDate,
  diary,
}: {
  entryDate: string;
  diary?: DiaryResponse;
}) {
  const [editing, setEditing] = useState(diary == null);
  const finishEditing = useCallback(() => setEditing(false), []);
  const startEditing = useCallback(() => setEditing(true), []);

  if (editing || !diary) {
    return (
      <DiaryEditor
        entryDate={entryDate}
        diary={diary}
        onSaved={finishEditing}
      />
    );
  }

  return (
    <DiaryReadScreen
      entryDate={entryDate}
      diary={diary}
      onEdit={startEditing}
    />
  );
}

export default function DiaryEntryScreen() {
  const { t } = useTranslation();
  const { date } = useLocalSearchParams<{ date: string }>();
  const { data: diaries, error, refetch } = useDiaryMonth(toMonthParam(date));
  const diary = diaries?.find((item) => item.entryDate === date);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      {diaries ? (
        <DiaryEntry entryDate={date} diary={diary} />
      ) : (
        <>
          <Stack.Screen
            options={{ title: formatFullDate(fromDateParam(date)) }}
          />
          <ScreenState
            error={error}
            message={t("diary.loadFailed")}
            onRetry={() => refetch()}
          />
        </>
      )}
    </SafeAreaView>
  );
}
