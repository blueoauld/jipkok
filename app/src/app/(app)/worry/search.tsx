import { Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { SearchList } from "@/components/SearchList";
import { WorryCard } from "@/components/worry/WorryCard";
import { MIN_KEYWORD_LENGTH, useWorrySearch } from "@/hooks/useWorrySearch";
import { pushOnce } from "@/lib/router";
import { WORRY_CONTENT_MAX_LENGTH } from "@/lib/validation";

export default function WorrySearchScreen() {
  const { t } = useTranslation();
  const screenOptions = useMemo(
    () => ({ title: t("worry.search.title") }),
    [t],
  );

  const [submitted, setSubmitted] = useState("");
  const search = useWorrySearch(submitted);

  const openDetail = useCallback(
    (worryId: number) => pushOnce(`/worry/${worryId}`),
    [],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      <SearchList
        hint={t("worry.search.hint", { count: MIN_KEYWORD_LENGTH })}
        placeholder={t("worry.search.placeholder")}
        maxLength={WORRY_CONTENT_MAX_LENGTH}
        query={search}
        submitted={submitted}
        items={search.posts}
        onSubmit={setSubmitted}
        keyExtractor={(worry) => String(worry.worryId)}
        renderItem={({ item }) => (
          <WorryCard worry={item} onPress={openDetail} />
        )}
      />
    </SafeAreaView>
  );
}
