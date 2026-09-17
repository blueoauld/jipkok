import { Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { DiaryRow } from "@/components/diary/DiaryRow";
import { SearchList } from "@/components/SearchList";
import { ListRowSeparator } from "@/components/ui/ListRow";
import { useDiarySearch } from "@/hooks/useDiarySearch";
import { pushOnce } from "@/lib/router";
import {
  MIN_KEYWORD_LENGTH,
  SEARCH_KEYWORD_MAX_LENGTH,
} from "@/lib/validation";

export default function DiarySearchScreen() {
  const { t } = useTranslation();
  const screenOptions = useMemo(
    () => ({ title: t("diary.search.title") }),
    [t],
  );

  const [submitted, setSubmitted] = useState("");
  const search = useDiarySearch(submitted);

  const openEntry = useCallback(
    (entryDate: string) => pushOnce(`/diary/${entryDate}`),
    [],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      <SearchList
        hint={t("diary.search.hint", { count: MIN_KEYWORD_LENGTH })}
        placeholder={t("diary.search.placeholder")}
        maxLength={SEARCH_KEYWORD_MAX_LENGTH}
        query={search}
        submitted={submitted}
        items={search.diaries}
        onSubmit={setSubmitted}
        keyExtractor={(diary) => diary.entryDate}
        renderItem={({ item }) => <DiaryRow diary={item} onPress={openEntry} />}
        ItemSeparatorComponent={ListRowSeparator}
        layout="rows"
      />
    </SafeAreaView>
  );
}
