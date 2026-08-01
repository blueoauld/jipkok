import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/ActivityList";
import { useMemberList, useRemoveFromMemberList } from "@/hooks/useMemberList";
import { api } from "@/lib/api";

const FAVORITES_KEY = ["favorites", "mine"];

export default function FavoriteListScreen() {
  const query = useMemberList(FAVORITES_KEY, api.favorites.mine);
  const remove = useRemoveFromMemberList(FAVORITES_KEY, api.favorites.remove);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "즐겨찾기 목록" }} />

      <ActivityList
        query={query}
        onDelete={(member) => remove.mutate(member.memberId)}
      />
    </SafeAreaView>
  );
}
