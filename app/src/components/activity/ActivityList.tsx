import { useMemo } from "react";
import { FlatList } from "react-native";
import { getTokens } from "tamagui";

import { ListEmpty } from "@/components/ui/ListEmpty";
import { ScreenState } from "@/components/ui/ScreenState";
import { UserRow } from "@/components/UserRow";
import type { MemberListQuery } from "@/hooks/useMemberList";
import { usePagedList } from "@/hooks/usePagedList";
import type { MemberSummaryResponse } from "@/lib/api";
import { LIST_ERROR_MESSAGE, MEMBER_EMPTY_MESSAGE } from "@/lib/message";

export function ActivityList({
  query,
  timeOf,
  onDelete,
}: {
  query: MemberListQuery;
  timeOf?: (member: MemberSummaryResponse) => string | undefined;
  onDelete?: (memberId: number) => void;
}) {
  const contentStyle = useMemo(() => {
    const space = getTokens().space;

    return { padding: space.$4.val, gap: space.$4.val };
  }, []);
  const { members, error } = query;
  const paged = usePagedList(query);

  if (!members) {
    return (
      <ScreenState
        error={error}
        message={LIST_ERROR_MESSAGE}
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
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentStyle}
      ListEmptyComponent={<ListEmpty>{MEMBER_EMPTY_MESSAGE}</ListEmpty>}
    />
  );
}
