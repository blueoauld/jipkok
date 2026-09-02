import { useMemo } from "react";
import { FlatList } from "react-native";
import { getTokens } from "tamagui";

import { ListEmpty } from "@/components/ui/ListEmpty";
import { ScreenState } from "@/components/ui/ScreenState";
import { UserRow } from "@/components/UserRow";
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
  const paged = usePagedList(query);
  const contentStyle = useMemo(
    () => ({
      ...paged.contentContainerStyle,
      paddingTop: getTokens().space.$4.val,
    }),
    [paged.contentContainerStyle],
  );

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
      showsVerticalScrollIndicator={true}
      contentContainerStyle={contentStyle}
      ListEmptyComponent={<ListEmpty>{memberEmptyMessage()}</ListEmpty>}
    />
  );
}
