import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import type { ReactNode } from "react";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, getTokens, Spinner, Text, XStack, YStack } from "tamagui";

import {
  api,
  type PointHistoryPage,
  type PointHistoryResponse,
} from "@/lib/api";
import { formatDateTime } from "@/lib/date";
import { formatAmount, pointTypeLabel } from "@/lib/point";

const BALANCE_KEY = ["points", "balance"];
const HISTORIES_KEY = ["points", "histories"];

const ERROR_MESSAGE = "내역을 불러오지 못했습니다.";
const EMPTY_MESSAGE = "내역이 비어있습니다.";

function Centered({ children }: { children: ReactNode }) {
  return (
    <YStack items="center" gap="$4" py="$8">
      {children}
    </YStack>
  );
}

function Balance() {
  const { data } = useQuery({
    queryKey: BALANCE_KEY,
    queryFn: api.points.balance,
  });

  return (
    <XStack
      items="center"
      justify="space-between"
      gap="$3"
      mx="$4"
      p="$4"
      bg="$gray4"
      rounded="$7"
    >
      <Text theme="gray" color="$color10" fontSize="$3" fontWeight="600">
        보유 포인트
      </Text>

      <Text fontSize="$6" fontWeight="700">
        {data === undefined ? "-" : data.toLocaleString()}
      </Text>
    </XStack>
  );
}

function HistoryRow({ history }: { history: PointHistoryResponse }) {
  const { type, amount, recordedAt } = history;
  const earned = amount > 0;

  return (
    <XStack items="center" gap="$3" px="$4">
      <YStack flex={1} gap="$1">
        <Text numberOfLines={1} fontSize="$4" fontWeight="600">
          {pointTypeLabel(type)}
        </Text>

        <Text theme="gray" color="$color10" fontSize="$3">
          {formatDateTime(recordedAt)}
        </Text>
      </YStack>

      <Text
        shrink={0}
        fontSize="$4"
        fontWeight="700"
        color={earned ? "$red10" : "$blue10"}
      >
        {formatAmount(amount)}
      </Text>
    </XStack>
  );
}

export default function PointHistoryScreen() {
  const space = getTokens().space;

  const query = useInfiniteQuery({
    queryKey: HISTORIES_KEY,
    queryFn: ({ pageParam }) => api.points.histories({ cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: PointHistoryPage) => page.nextCursor,
  });

  const { data, isError, isFetchingNextPage, hasNextPage, fetchNextPage } =
    query;
  const histories = data?.pages.flatMap((page) => page.items);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "포인트 내역" }} />

      <YStack flex={1} gap="$4" pt="$4">
        <Balance />

        {histories ? (
          <FlatList
            data={histories}
            keyExtractor={(history) => String(history.historyId)}
            renderItem={({ item }) => <HistoryRow history={item} />}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{
              paddingBottom: space.$4.val,
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
        ) : (
          <Centered>
            {isError ? (
              <>
                <Text color="$gray10" fontSize="$4">
                  {ERROR_MESSAGE}
                </Text>

                <Button
                  size="$3"
                  theme="blue"
                  rounded="$7"
                  onPress={() => query.refetch()}
                >
                  다시 시도
                </Button>
              </>
            ) : (
              <Spinner size="small" />
            )}
          </Centered>
        )}
      </YStack>
    </SafeAreaView>
  );
}
