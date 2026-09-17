import { FlatList } from "react-native";

import { ListEmpty } from "@/components/ui/ListEmpty";
import { ScreenState } from "@/components/ui/ScreenState";
import {
  UserRow,
  UserRowSeparator,
  UserRowTopSpacer,
} from "@/components/UserRow";
import type { MemberListQuery } from "@/hooks/useMemberList";
import { usePagedList } from "@/hooks/usePagedList";
import type { MemberSummaryResponse } from "@/lib/api";
import { listErrorMessage, memberEmptyMessage } from "@/lib/message";

export function ActivityList({
  query,
  timeOf,
  onDelete,
}: {
  query: MemberListQuery;
  timeOf?: (member: MemberSummaryResponse) => string | undefined;
  onDelete?: (memberId: number) => void;
}) {
  const { members, error } = query;
  const paged = usePagedList(query, 0, "rows");

  if (!members) {
    return (
      <ScreenState
        error={error}
        message={listErrorMessage()}
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <FlatList
      {...paged}
      data={members}
      keyExtractor={(member) => String(member.memberId)}
      renderItem={({ item }) => (
        <UserRow member={item} at={timeOf?.(item)} onDelete={onDelete} />
      )}
      ListHeaderComponent={UserRowTopSpacer}
      ItemSeparatorComponent={UserRowSeparator}
      showsVerticalScrollIndicator={true}
      ListEmptyComponent={<ListEmpty>{memberEmptyMessage()}</ListEmpty>}
    />
  );
}
