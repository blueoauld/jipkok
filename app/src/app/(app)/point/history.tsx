import { Stack } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

import { Border } from "@/components/ui/Border";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { ListRow, ListRowTopSpacer } from "@/components/ui/ListRow";
import { ScreenState } from "@/components/ui/ScreenState";
import { Text } from "@/components/ui/Text";
import { usePagedList } from "@/hooks/usePagedList";
import { usePointBalance, usePointHistories } from "@/hooks/usePoints";
import type { PointHistoryResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/date";
import { LIST_ROW_EVEN_PADDING_Y, SCREEN_PADDING } from "@/lib/design";
import { formatAmount, pointTypeLabel } from "@/lib/point";

function Balance() {
  const { t } = useTranslation();
  const { data } = usePointBalance();

  return (
    <ListRow
      horizontalPadding="small"
      verticalPadding={SCREEN_PADDING}
      right={
        <Text preset="title" color="$grey800">
          {data === undefined ? "-" : data.toLocaleString()}
        </Text>
      }
    >
      <Text preset="label" color="$grey800">
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
    <ListRow
      horizontalPadding="small"
      verticalPadding={LIST_ROW_EVEN_PADDING_Y}
    >
      <XStack items="center" justify="space-between" gap="$2">
        <Text preset="label" flex={1} numberOfLines={1} color="$grey800">
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
        <Text preset="sub" flex={1} numberOfLines={1} color="$grey600">
          {formatDateTime(recordedAt)}
        </Text>

        <Text preset="caption" shrink={0} color="$grey500">
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
            ListHeaderComponent={
              <ListRowTopSpacer verticalPadding={LIST_ROW_EVEN_PADDING_Y} />
            }
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
