import { Stack } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import { ListEmpty } from "@/components/ui/ListEmpty";
import { RetroCard } from "@/components/ui/RetroCard";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { usePagedList } from "@/hooks/usePagedList";
import { usePointBalance, usePointHistories } from "@/hooks/usePoints";
import type { PointHistoryResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/date";
import { formatAmount, pointTypeLabel } from "@/lib/point";

function Balance() {
  const { t } = useTranslation();
  const { data } = usePointBalance();

  return (
    <YStack mx="$4">
      <RetroCard p="$4">
        <XStack items="center" justify="space-between" gap="$3">
          <SectionLabel>{t("point.history.balance")}</SectionLabel>

          <Text fontSize="$6" fontWeight="700">
            {data === undefined ? "-" : data.toLocaleString()}
          </Text>
        </XStack>
      </RetroCard>
    </YStack>
  );
}

function HistoryRow({ history }: { history: PointHistoryResponse }) {
  const { t } = useTranslation();
  const { type, amount, balanceAfter, recordedAt } = history;
  const earned = amount > 0;

  return (
    <RetroCard>
      <XStack items="center" gap="$3">
        <YStack flex={1} gap="$1">
          <Text numberOfLines={1} fontSize="$4" fontWeight="500">
            {pointTypeLabel(type)}
          </Text>

          <Text theme="gray" color="$color11" fontSize="$2">
            {formatDateTime(recordedAt)}
          </Text>
        </YStack>

        <YStack shrink={0} items="flex-end" gap="$1">
          <Text
            fontSize="$4"
            fontWeight="700"
            color={earned ? "$red10" : "$blue10"}
          >
            {formatAmount(amount)}
          </Text>

          <Text theme="gray" color="$color11" fontSize="$2">
            {t("point.history.balanceAfter", {
              balance: balanceAfter.toLocaleString(),
            })}
          </Text>
        </YStack>
      </XStack>
    </RetroCard>
  );
}

export default function PointHistoryScreen() {
  const { t } = useTranslation();
  const screenOptions = useMemo(() => ({ title: t("list.pointHistory") }), [t]);

  const query = usePointHistories();
  const { histories, error } = query;
  const paged = usePagedList(query);
  const balance = usePointBalance();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

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
              ...paged.contentContainerStyle,
              paddingTop: 0,
            }}
            ListEmptyComponent={
              <ListEmpty>{t("point.history.emptyMessage")}</ListEmpty>
            }
          />
        ) : (
          <ScreenState
            error={error}
            message={t("point.history.errorMessage")}
            onRetry={() => {
              query.refetch();
              balance.refetch();
            }}
          />
        )}
      </YStack>
    </SafeAreaView>
  );
}
