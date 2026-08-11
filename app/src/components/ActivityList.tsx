import type { ReactNode } from "react";
import { FlatList } from "react-native";
import { getTokens, Spinner, Text, YStack } from "tamagui";

import { ActivityRow } from "@/components/ActivityRow";
import { ErrorState } from "@/components/ui/ErrorState";
import type { MemberListQuery } from "@/hooks/useMemberList";
import type { MemberSummaryResponse } from "@/lib/api";
import { pushOnce } from "@/lib/router";

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
  captionOf,
  onDelete,
}: {
  query: MemberListQuery;
  captionOf?: (member: MemberSummaryResponse) => string | undefined;
  onDelete?: (member: MemberSummaryResponse) => void;
}) {
  const space = getTokens().space;
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
        <ActivityRow
          member={item}
          caption={captionOf?.(item)}
          onPress={() => pushOnce(`/member/${item.memberId}`)}
          onDelete={onDelete && (() => onDelete(item))}
        />
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: space.$4.val, gap: space.$4.val }}
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
          <Text theme="gray" color="$color10" fontSize="$4">
            {EMPTY_MESSAGE}
          </Text>
        </Centered>
      }
    />
  );
}
