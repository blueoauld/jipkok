import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/ActivityList";
import { useMemberList, useRemoveFromMemberList } from "@/hooks/useMemberList";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api } from "@/lib/api";

const FAVORITES_KEY = ["favorites", "mine"];

const SCREEN_OPTIONS = { title: "즐겨찾기 목록" };

export default function FavoriteListScreen() {
  const query = useMemberList(FAVORITES_KEY, api.favorites.mine);
  const { alertElement, showApiError } = useRetroAlert();
  const remove = useRemoveFromMemberList(
    FAVORITES_KEY,
    api.favorites.remove,
    showApiError,
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={SCREEN_OPTIONS} />

      <ActivityList query={query} onDelete={remove.mutate} />

      {alertElement}
    </SafeAreaView>
  );
}
