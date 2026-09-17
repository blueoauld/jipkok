import { Stack } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import { Border } from "@/components/ui/Border";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { ListRow, ListRowSeparator } from "@/components/ui/ListRow";
import { ScreenState } from "@/components/ui/ScreenState";
import { usePagedList } from "@/hooks/usePagedList";
import { usePointBalance, usePointHistories } from "@/hooks/usePoints";
import type { PointHistoryResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/date";
import { formatAmount, pointTypeLabel } from "@/lib/point";

function Balance() {
  const { t } = useTranslation();
  const { data } = usePointBalance();

  return (
    <ListRow
      horizontalPadding="small"
      right={
        <Text fontSize="$6" lineHeight="$6" fontWeight="700" color="$grey800">
          {data === undefined ? "-" : data.toLocaleString()}
        </Text>
      }
    >
      <Text fontSize="$4" lineHeight="$4" fontWeight="500" color="$grey800">
        {t("point.history.balance")}
      </Text>
    </ListRow>
  );
}

function HistoryRow({ history }: { history: PointHistoryResponse }) {
  const { t } = useTranslation();
  const { type, amount, balanceAfter, recordedAt } = history;
  const earned = amount > 0;

  return (
    <ListRow horizontalPadding="small">
      <XStack items="center" justify="space-between" gap="$2">
        <Text
          flex={1}
          numberOfLines={1}
          fontSize="$4"
          lineHeight="$4"
          fontWeight="500"
          color="$grey800"
        >
          {pointTypeLabel(type)}
        </Text>

        <Text
          shrink={0}
          fontSize="$4"
          lineHeight="$4"
          fontWeight="700"
          color={earned ? "$red500" : "$blue500"}
        >
          {formatAmount(amount)}
        </Text>
      </XStack>

      <XStack items="center" justify="space-between" gap="$2">
        <Text
          flex={1}
          numberOfLines={1}
          fontSize="$2"
          lineHeight="$2"
          color="$grey600"
        >
          {formatDateTime(recordedAt)}
        </Text>

        <Text shrink={0} fontSize="$1" color="$grey500">
          {t("point.history.balanceAfter", {
            balance: balanceAfter.toLocaleString(),
          })}
        </Text>
      </XStack>
    </ListRow>
  );
}

export default function PointHistoryScreen() {
  const { t } = useTranslation();
  const screenOptions = useMemo(() => ({ title: t("list.pointHistory") }), [t]);

  const query = usePointHistories();
  const { histories, error } = query;
  const paged = usePagedList(query, 0, "rows");
  const balance = usePointBalance();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      <YStack flex={1}>
        <Balance />
        <Border variant="height16" />

        {histories ? (
          <FlatList
            {...paged}
            data={histories}
            keyExtractor={(history) => String(history.historyId)}
            renderItem={({ item }) => <HistoryRow history={item} />}
            ItemSeparatorComponent={ListRowSeparator}
            showsVerticalScrollIndicator={true}
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
