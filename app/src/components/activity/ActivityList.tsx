import { type ReactNode, useMemo } from "react";
import { FlatList } from "react-native";
import { getTokens, Spinner, YStack } from "tamagui";

import { ActivityRow } from "@/components/activity/ActivityRow";
import { EmptyMessage } from "@/components/ui/EmptyMessage";
import { ErrorState } from "@/components/ui/ErrorState";
import type { MemberListQuery } from "@/hooks/useMemberList";
import { usePagedList } from "@/hooks/usePagedList";
import type { MemberSummaryResponse } from "@/lib/api";
import { LIST_ERROR_MESSAGE } from "@/lib/message";

const EMPTY_MESSAGE = "목록이 비어있습니다.";

function Centered({ children }: { children: ReactNode }) {
  return (
    <YStack items="center" gap="$4" py="$8">
      {children}
    </YStack>
  );
}

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
  const { members, isError } = query;
  const paged = usePagedList(query);

  if (!members) {
    return (
      <Centered>
        {isError ? (
          <ErrorState
            message={LIST_ERROR_MESSAGE}
            onRetry={() => query.refetch()}
          />
        ) : (
          <Spinner size="small" />
        )}
      </Centered>
    );
  }

  return (
    <FlatList
      {...paged}
      data={members}
      keyExtractor={(member) => String(member.memberId)}
      renderItem={({ item }) => (
        <ActivityRow member={item} at={timeOf?.(item)} onDelete={onDelete} />
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentStyle}
      ListEmptyComponent={
        <Centered>
          <EmptyMessage>{EMPTY_MESSAGE}</EmptyMessage>
        </Centered>
      }
    />
  );
}
