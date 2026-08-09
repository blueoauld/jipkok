import { Stack } from "expo-router";
import { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/ActivityList";
import { useNow } from "@/hooks/useNow";
import {
  useMarkProfileViewsSeen,
  useProfileViews,
} from "@/hooks/useProfileViews";
import { formatRelativeTime } from "@/lib/date";

export default function ProfileViewListScreen() {
  const query = useProfileViews();
  const now = useNow();

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
      <Stack.Screen options={{ title: "내 프로필 조회 목록" }} />

      <ActivityList
        query={{ ...query, members }}
        captionOf={(member) => {
          const at = viewedAt.get(member.memberId);

          return at ? formatRelativeTime(at, now) : undefined;
        }}
      />
    </SafeAreaView>
  );
}
