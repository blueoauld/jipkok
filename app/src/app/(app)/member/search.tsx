import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { SearchList } from "@/components/SearchList";
import { UserRow } from "@/components/UserRow";
import { useMemberSearch } from "@/hooks/useMemberSearch";
import { MIN_KEYWORD_LENGTH } from "@/lib/validation";

export default function MemberSearchScreen() {
  const { t } = useTranslation();
  const screenOptions = useMemo(
    () => ({ title: t("member.search.title") }),
    [t],
  );

  const [submitted, setSubmitted] = useState("");
  const search = useMemberSearch(submitted);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      <SearchList
        hint={t("member.search.hint", { count: MIN_KEYWORD_LENGTH })}
        query={search}
        submitted={submitted}
        onSubmit={setSubmitted}
        items={search.members}
        keyExtractor={(member) => String(member.memberId)}
        renderItem={({ item }) => <UserRow member={item} />}
        layout="rows"
      />
    </SafeAreaView>
  );
}
