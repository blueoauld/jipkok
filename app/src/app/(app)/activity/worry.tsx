import { Stack } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ListEmpty } from "@/components/ui/ListEmpty";
import { ScreenState } from "@/components/ui/ScreenState";
import { WorryCard } from "@/components/worry/WorryCard";
import { usePagedList } from "@/hooks/usePagedList";
import { useMyWorryPosts } from "@/hooks/useWorryPosts";
import { pushOnce } from "@/lib/router";

const SCREEN_OPTIONS = { title: "고민 목록" };

const EMPTY_MESSAGE = "올린 고민이 없습니다.";
const ERROR_MESSAGE = "고민을 불러오지 못했습니다.";

export default function MyWorryListScreen() {
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
      <Stack.Screen options={SCREEN_OPTIONS} />

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
          ListEmptyComponent={<ListEmpty>{EMPTY_MESSAGE}</ListEmpty>}
        />
      ) : (
        <ScreenState error={error} message={ERROR_MESSAGE} onRetry={refetch} />
      )}
    </SafeAreaView>
  );
}
