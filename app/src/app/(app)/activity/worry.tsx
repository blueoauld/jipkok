import { Stack } from "expo-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "tamagui";

import { ListEmpty } from "@/components/ui/ListEmpty";
import { ScreenState } from "@/components/ui/ScreenState";
import { WorryCard } from "@/components/worry/WorryCard";
import { usePagedList } from "@/hooks/usePagedList";
import { usePullRefresh } from "@/hooks/usePullRefresh";
import { useMyWorryPosts } from "@/hooks/useWorryPosts";
import { pushOnce } from "@/lib/router";

export default function MyWorryListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const screenOptions = useMemo(() => ({ title: t("list.worries") }), [t]);

  const worries = useMyWorryPosts();
  const { posts, error, refetch } = worries;
  const paged = usePagedList(worries, 0, "cards");
  const { refreshing, onRefresh } = usePullRefresh(refetch);

  const openDetail = useCallback(
    (worryId: number) => pushOnce(`/worry/${worryId}`),
    [],
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.greyBackground.val }}
      edges={["bottom"]}
    >
      <Stack.Screen options={screenOptions} />

      {posts ? (
        <FlatList
          {...paged}
          data={posts}
          keyExtractor={(worry) => String(worry.worryId)}
          renderItem={({ item }) => (
            <WorryCard worry={item} onPress={openDetail} />
          )}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <ListEmpty>{t("worry.list.emptyMessage")}</ListEmpty>
          }
        />
      ) : (
        <ScreenState
          error={error}
          message={t("worry.loadFailed")}
          onRetry={refetch}
        />
      )}
    </SafeAreaView>
  );
}
