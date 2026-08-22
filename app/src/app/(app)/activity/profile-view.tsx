import { Stack } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/activity/ActivityList";
import {
  useMarkProfileViewsSeen,
  useProfileViews,
} from "@/hooks/useProfileViews";

export default function ProfileViewListScreen() {
  const { t } = useTranslation();
  const screenOptions = useMemo(
    () => ({ title: t("activity.profileView") }),
    [t],
  );

  const query = useProfileViews();

  useMarkProfileViewsSeen(query.isSuccess);

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
      <Stack.Screen options={screenOptions} />

      <ActivityList
        query={{ ...query, members }}
        timeOf={(member) => viewedAt.get(member.memberId)}
      />
    </SafeAreaView>
  );
}
