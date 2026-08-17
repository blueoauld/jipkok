import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/activity/ActivityList";
import {
  relationListKey,
  useMemberList,
  useRemoveFromMemberList,
} from "@/hooks/useMemberList";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api } from "@/lib/api";

const LIKES_KEY = relationListKey("likes", "mine");

const SCREEN_OPTIONS = { title: "좋아요 목록" };

export default function LikeListScreen() {
  const query = useMemberList(LIKES_KEY, api.likes.mine);
  const { alertElement, showApiError } = useRetroAlert();
  const remove = useRemoveFromMemberList(
    LIKES_KEY,
    api.likes.remove,
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
