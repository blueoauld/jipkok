import { Stack } from "expo-router";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTokens, Text, XStack, YStack } from "tamagui";

import { ListEmpty } from "@/components/ui/ListEmpty";
import { RetroCard } from "@/components/ui/RetroCard";
import { ScreenState } from "@/components/ui/ScreenState";
import { usePagedList } from "@/hooks/usePagedList";
import { usePointBalance, usePointHistories } from "@/hooks/usePoints";
import type { PointHistoryResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/date";
import { formatAmount, pointTypeLabel } from "@/lib/point";
import { useAccentToken } from "@/lib/theme/accent";

const ERROR_MESSAGE = "내역을 불러오지 못했습니다.";
const EMPTY_MESSAGE = "내역이 없습니다.";

function Balance() {
  const { data } = usePointBalance();

  return (
    <YStack mx="$4">
      <RetroCard p="$4">
        <XStack items="center" justify="space-between" gap="$3">
          <Text theme="gray" color="$color11" fontSize="$3" fontWeight="600">
            보유 포인트
          </Text>

          <Text fontSize="$6" fontWeight="700">
            {data === undefined ? "-" : data.toLocaleString()}
          </Text>
        </XStack>
      </RetroCard>
    </YStack>
  );
}

function HistoryRow({ history }: { history: PointHistoryResponse }) {
  const { type, amount, recordedAt } = history;
  const earned = amount > 0;
  const accent = useAccentToken();

  return (
    <RetroCard>
      <XStack items="center" gap="$3">
        <YStack flex={1} gap="$1">
          <Text numberOfLines={1} fontSize="$4" fontWeight="600">
            {pointTypeLabel(type)}
          </Text>

          <Text theme="gray" color="$color11" fontSize="$3">
            {formatDateTime(recordedAt)}
          </Text>
        </YStack>

        <Text
          shrink={0}
          fontSize="$4"
          fontWeight="700"
          color={earned ? "$red10" : accent}
        >
          {formatAmount(amount)}
        </Text>
      </XStack>
    </RetroCard>
  );
}

const SCREEN_OPTIONS = { title: "포인트 내역" };

export default function PointHistoryScreen() {
  const space = getTokens().space;

  const query = usePointHistories();
  const { histories, error } = query;
  const paged = usePagedList(query);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={SCREEN_OPTIONS} />

      <YStack flex={1} gap="$4" pt="$4">
        <Balance />

        {histories ? (
          <FlatList
            {...paged}
            data={histories}
            keyExtractor={(history) => String(history.historyId)}
            renderItem={({ item }) => <HistoryRow history={item} />}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{
              paddingHorizontal: space.$4.val,
              paddingBottom: space.$4.val,
              gap: space.$4.val,
            }}
            ListEmptyComponent={<ListEmpty>{EMPTY_MESSAGE}</ListEmpty>}
          />
        ) : (
          <ScreenState
            error={error}
            message={ERROR_MESSAGE}
            onRetry={() => query.refetch()}
          />
        )}
      </YStack>
    </SafeAreaView>
  );
}
