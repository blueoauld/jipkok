import { Stack } from "expo-router";
import { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/activity/ActivityList";
import { useAlert } from "@/hooks/useAlert";
import {
  type MemberListFetcher,
  useMemberList,
  useRemoveFromMemberList,
} from "@/hooks/useMemberList";

type Remover = (memberId: number) => Promise<void>;

function RemovableList({
  query,
  listKey,
  remove,
}: {
  query: ReturnType<typeof useMemberList>;
  listKey: string[];
  remove: Remover;
}) {
  const { alertElement, showApiError } = useAlert();
  const removal = useRemoveFromMemberList(listKey, remove, showApiError);

  return (
    <>
      <ActivityList query={query} onDelete={removal.mutate} />

      {alertElement}
    </>
  );
}

export function RelationListScreen({
  title,
  listKey,
  fetch,
  remove,
}: {
  title: string;
  listKey: string[];
  fetch: MemberListFetcher;
  remove?: Remover;
}) {
  const screenOptions = useMemo(() => ({ title }), [title]);
  const query = useMemberList(listKey, fetch);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      {remove ? (
        <RemovableList query={query} listKey={listKey} remove={remove} />
      ) : (
        <ActivityList query={query} />
      )}
    </SafeAreaView>
  );
}
