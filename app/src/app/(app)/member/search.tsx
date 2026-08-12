import { Stack } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { SearchList } from "@/components/SearchList";
import { UserRow } from "@/components/UserRow";
import { MIN_KEYWORD_LENGTH, useMemberSearch } from "@/hooks/useMemberSearch";

const HINT_MESSAGE = `닉네임을 ${MIN_KEYWORD_LENGTH}자 이상 입력해주시길 바랍니다.`;

const SCREEN_OPTIONS = { title: "회원 검색" };

export default function MemberSearchScreen() {
  const [submitted, setSubmitted] = useState("");
  const search = useMemberSearch(submitted);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={SCREEN_OPTIONS} />

      <SearchList
        hint={HINT_MESSAGE}
        query={search}
        submitted={submitted}
        onSubmit={setSubmitted}
        items={search.members}
        keyExtractor={(member) => String(member.memberId)}
        renderItem={({ item }) => <UserRow member={item} />}
      />
    </SafeAreaView>
  );
}
