import { Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ListEmpty } from "@/components/ui/ListEmpty";
import { ScreenState } from "@/components/ui/ScreenState";
import { WorryCard } from "@/components/worry/WorryCard";
import { usePagedList } from "@/hooks/usePagedList";
import { useMyWorryPosts } from "@/hooks/useWorryPosts";
import { pushOnce } from "@/lib/router";

export default function MyWorryListScreen() {
  const { t } = useTranslation();
  const screenOptions = useMemo(() => ({ title: t("worry.list.title") }), [t]);

  const [refreshing, setRefreshing] = useState(false);
  const worries = useMyWorryPosts();
  const { posts, error, refetch } = worries;
  const paged = usePagedList(worries);

  const refresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const openDetail = useCallback(
    (worryId: number) => pushOnce(`/worry/${worryId}`),
    [],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
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
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          ListEmptyComponent={
            <ListEmpty>{t("worry.list.emptyMessage")}</ListEmpty>
          }
        />
      ) : (
        <ScreenState
          error={error}
          message={t("worry.list.errorMessage")}
          onRetry={refetch}
        />
      )}
    </SafeAreaView>
  );
}
