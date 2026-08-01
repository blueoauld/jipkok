import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/ActivityList";
import { useMemberList } from "@/hooks/useMemberList";
import { api } from "@/lib/api";

const RECEIVED_LIKES_KEY = ["likes", "received"];

export default function ReceivedLikeListScreen() {
  const query = useMemberList(RECEIVED_LIKES_KEY, api.likes.received);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "받은 좋아요 목록" }} />

      <ActivityList query={query} />
    </SafeAreaView>
  );
}
