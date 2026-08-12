import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/ActivityList";
import { useMemberList } from "@/hooks/useMemberList";
import { api } from "@/lib/api";

const RECEIVED_FAVORITES_KEY = ["favorites", "received"];

const SCREEN_OPTIONS = { title: "받은 즐겨찾기 목록" };

export default function ReceivedFavoriteListScreen() {
  const query = useMemberList(RECEIVED_FAVORITES_KEY, api.favorites.received);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={SCREEN_OPTIONS} />

      <ActivityList query={query} />
    </SafeAreaView>
  );
}
