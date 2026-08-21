import { Stack } from "expo-router";
import { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { SearchList } from "@/components/SearchList";
import { WorryCard } from "@/components/worry/WorryCard";
import { MIN_KEYWORD_LENGTH, useWorrySearch } from "@/hooks/useWorrySearch";
import { pushOnce } from "@/lib/router";
import { WORRY_CONTENT_MAX_LENGTH } from "@/lib/validation";

const HINT_MESSAGE = `내용을 ${MIN_KEYWORD_LENGTH}자 이상 입력해주시길 바랍니다.`;

const SCREEN_OPTIONS = { title: "고민 검색" };

export default function WorrySearchScreen() {
  const [submitted, setSubmitted] = useState("");
  const search = useWorrySearch(submitted);

  const openDetail = useCallback(
    (worryId: number) => pushOnce(`/worry/${worryId}`),
    [],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={SCREEN_OPTIONS} />

      <SearchList
        hint={HINT_MESSAGE}
        placeholder="고민 내용"
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
