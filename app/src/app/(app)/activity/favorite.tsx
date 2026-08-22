import { Stack } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/activity/ActivityList";
import {
  relationListKey,
  useMemberList,
  useRemoveFromMemberList,
} from "@/hooks/useMemberList";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api } from "@/lib/api";

const FAVORITES_KEY = relationListKey("favorites", "mine");

export default function FavoriteListScreen() {
  const { t } = useTranslation();
  const screenOptions = useMemo(() => ({ title: t("activity.favorite") }), [t]);

  const query = useMemberList(FAVORITES_KEY, api.favorites.mine);
  const { alertElement, showApiError } = useRetroAlert();
  const remove = useRemoveFromMemberList(
    FAVORITES_KEY,
    api.favorites.remove,
    showApiError,
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      <ActivityList query={query} onDelete={remove.mutate} />

      {alertElement}
    </SafeAreaView>
  );
}
