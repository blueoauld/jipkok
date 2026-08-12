import { Stack } from "expo-router";
import { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/ActivityList";
import {
  useMarkProfileViewsSeen,
  useProfileViews,
} from "@/hooks/useProfileViews";

const SCREEN_OPTIONS = { title: "내 프로필 조회 목록" };

export default function ProfileViewListScreen() {
  const query = useProfileViews();

  useMarkProfileViewsSeen(!query.isPending);

  const viewedAt = useMemo(
    () =>
      new Map(
        query.views?.map((view) => [view.member.memberId, view.viewedAt]),
      ),
    [query.views],
  );

  const members = useMemo(
    () => query.views?.map((view) => view.member),
    [query.views],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={SCREEN_OPTIONS} />

      <ActivityList
        query={{ ...query, members }}
        timeOf={(member) => viewedAt.get(member.memberId)}
      />
    </SafeAreaView>
  );
}
