import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/ActivityList";
import { useMemberList, useRemoveFromMemberList } from "@/hooks/useMemberList";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api } from "@/lib/api";

const BLOCKS_KEY = ["blocks", "mine"];

const SCREEN_OPTIONS = { title: "차단 목록" };

export default function BlockListScreen() {
  const query = useMemberList(BLOCKS_KEY, api.blocks.mine);
  const { alertElement, showApiError } = useRetroAlert();
  const remove = useRemoveFromMemberList(
    BLOCKS_KEY,
    api.blocks.remove,
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
