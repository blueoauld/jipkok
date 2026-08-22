import { Stack } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/activity/ActivityList";
import { relationListKey, useMemberList } from "@/hooks/useMemberList";
import { api } from "@/lib/api";

const RECEIVED_FAVORITES_KEY = relationListKey("favorites", "received");

export default function ReceivedFavoriteListScreen() {
  const { t } = useTranslation();
  const screenOptions = useMemo(
    () => ({ title: t("activity.favoriteReceived") }),
    [t],
  );

  const query = useMemberList(RECEIVED_FAVORITES_KEY, api.favorites.received);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      <ActivityList query={query} />
    </SafeAreaView>
  );
}
