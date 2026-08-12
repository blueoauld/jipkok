import { useRef, useState } from "react";
import { FlatList } from "react-native";
import { getTokens, Spinner, Text, YStack } from "tamagui";

import {
  SCROLL_EVENT_THROTTLE,
  ScrollToTopButton,
  useScrollToTopVisible,
} from "@/components/ScrollToTopButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { RetroSegmentedControl } from "@/components/ui/RetroSegmentedControl";
import { UserRow } from "@/components/UserRow";
import { useMemberRanking } from "@/hooks/useMemberRanking";
import { isApiError } from "@/lib/api";
import {
  GENDER_FILTER_VALUES,
  GENDER_FILTERS,
  type GenderFilter,
} from "@/lib/member";

const ERROR_MESSAGE = "랭킹을 불러오지 못했습니다.";
const EMPTY_MESSAGE = "회원이 없습니다.";

export default function RankScreen() {
  const space = getTokens().space;
  const [filter, setFilter] = useState<GenderFilter>("전체");
  const listRef = useRef<FlatList>(null);
  const scrollTop = useScrollToTopVisible();

  const ranking = useMemberRanking(GENDER_FILTER_VALUES[filter]);
  const { members, error, isFetchingNextPage, hasNextPage, fetchNextPage } =
    ranking;

  return (
    <YStack flex={1}>
      <YStack px="$4" pt="$4" pb="$3">
        <RetroSegmentedControl
          values={GENDER_FILTERS}
          value={filter}
          onChange={(next) => {
            setFilter(next);
            listRef.current?.scrollToOffset({ offset: 0, animated: false });
          }}
        />
      </YStack>

      {members ? (
        <FlatList
          ref={listRef}
          data={members}
          keyExtractor={(member) => String(member.memberId)}
          renderItem={({ item }) => <UserRow member={item} />}
          showsVerticalScrollIndicator={true}
          onScroll={scrollTop.onScroll}
          scrollEventThrottle={SCROLL_EVENT_THROTTLE}
          contentContainerStyle={{
            paddingTop: space.$2.val,
            paddingBottom: space.$4.val,
            paddingHorizontal: space.$4.val,
            gap: space.$4.val,
          }}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <YStack items="center" py="$4">
                <Spinner size="small" />
              </YStack>
            ) : null
          }
          ListEmptyComponent={
            <YStack items="center" py="$8">
              <Text theme="gray" color="$color10" fontSize="$4">
                {EMPTY_MESSAGE}
              </Text>
            </YStack>
          }
        />
      ) : (
        <YStack flex={1} justify="center" items="center" gap="$4" p="$4">
          {error ? (
            <ErrorState
              message={isApiError(error) ? error.message : ERROR_MESSAGE}
              onRetry={() => ranking.refetch()}
            />
          ) : (
            <Spinner size="small" />
          )}
        </YStack>
      )}

      <ScrollToTopButton
        visible={scrollTop.visible}
        onPress={() => listRef.current?.scrollToOffset({ offset: 0 })}
      />
    </YStack>
  );
}
