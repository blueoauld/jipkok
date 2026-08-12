import { type ReactNode, useMemo } from "react";
import { FlatList } from "react-native";
import { getTokens, Spinner, YStack } from "tamagui";

import { ActivityRow } from "@/components/ActivityRow";
import { EmptyMessage } from "@/components/ui/EmptyMessage";
import { ErrorState } from "@/components/ui/ErrorState";
import type { MemberListQuery } from "@/hooks/useMemberList";
import type { MemberSummaryResponse } from "@/lib/api";

const ERROR_MESSAGE = "목록을 불러오지 못했습니다.";
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
  const { members, isError, isFetchingNextPage, hasNextPage, fetchNextPage } =
    query;

  if (!members) {
    return (
      <Centered>
        {isError ? (
          <ErrorState message={ERROR_MESSAGE} onRetry={() => query.refetch()} />
        ) : (
          <Spinner size="small" />
        )}
      </Centered>
    );
  }

  return (
    <FlatList
      data={members}
      keyExtractor={(member) => String(member.memberId)}
      renderItem={({ item }) => (
        <ActivityRow member={item} at={timeOf?.(item)} onDelete={onDelete} />
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentStyle}
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      ListFooterComponent={
        isFetchingNextPage ? (
          <Centered>
            <Spinner size="small" />
          </Centered>
        ) : null
      }
      ListEmptyComponent={
        <Centered>
          <EmptyMessage>{EMPTY_MESSAGE}</EmptyMessage>
        </Centered>
      }
    />
  );
}
