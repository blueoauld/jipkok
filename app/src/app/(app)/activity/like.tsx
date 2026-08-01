import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/ActivityList";
import { useMemberList, useRemoveFromMemberList } from "@/hooks/useMemberList";
import { api } from "@/lib/api";

const LIKES_KEY = ["likes", "mine"];

export default function LikeListScreen() {
  const query = useMemberList(LIKES_KEY, api.likes.mine);
  const remove = useRemoveFromMemberList(LIKES_KEY, api.likes.remove);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "좋아요 목록" }} />

      <ActivityList
        query={query}
        onDelete={(member) => remove.mutate(member.memberId)}
      />
    </SafeAreaView>
  );
}
