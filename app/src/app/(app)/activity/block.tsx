import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/ActivityList";
import { useMemberList, useRemoveFromMemberList } from "@/hooks/useMemberList";
import { api } from "@/lib/api";

const BLOCKS_KEY = ["blocks", "mine"];

export default function BlockListScreen() {
  const query = useMemberList(BLOCKS_KEY, api.blocks.mine);
  const remove = useRemoveFromMemberList(BLOCKS_KEY, api.blocks.remove);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "차단 목록" }} />

      <ActivityList
        query={query}
        onDelete={(member) => remove.mutate(member.memberId)}
      />
    </SafeAreaView>
  );
}
